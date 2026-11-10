const express = require('express');
const db = require('../../db');
const { session, requireUser } = require('./communitySession');
const { createNotification } = require('../../notify');
const posts = express.Router();
const comments = express.Router();
const files = express.Router();
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const fail = (message,status=400) => { const e=new Error(message); e.status=status; throw e; };
const id = value => { const n=Number(value); if (!Number.isSafeInteger(n)||n<1) fail('올바른 번호가 필요합니다.'); return n; };
const text = (value,max) => { if(typeof value!=='string'||!value.trim()||value.trim().length>max) fail('입력 내용과 길이를 확인해주세요.'); return value.trim(); };
const anonymous = (value, fallback=false) => value===undefined ? fallback : value===true || value===1 || value==='true' || value==='1';
async function transaction(fn) {
  const c=await db.getConnection();
  try { await c.beginTransaction(); const result=await fn(c); await c.commit(); return result; }
  catch(e) { await c.rollback(); throw e; } finally { c.release(); }
}
// 반드시 게시글 행을 먼저 FOR UPDATE로 잠근 트랜잭션 안에서 호출합니다.
async function numberFor(c,postId,userId) {
  const [rows]=await c.query('SELECT anonymous_number FROM community_anonymous WHERE post_id=? AND employee_id=?',[postId,userId]);
  if(rows.length) return rows[0].anonymous_number;
  const [counts]=await c.query('SELECT COALESCE(MAX(anonymous_number),0)+1 AS n FROM community_anonymous WHERE post_id=?',[postId]);
  const n=Number(counts[0].n);
  await c.query('INSERT INTO community_anonymous VALUES (?,?,?)',[postId,userId,n]);
  return n;
}
function decodeFiles(input=[]) {
  if(!Array.isArray(input)||input.length>5) fail('첨부파일은 최대 5개입니다.');
  let total=0;
  return input.map(f=>{
    if(!f || typeof f.name!=='string'||!f.name.trim()||f.name.length>255||/[\x00-\x1f/\\]/.test(f.name)) fail('파일 이름을 확인해주세요.');
    if(typeof f.base64!=='string'||f.base64.length>7*1024*1024||f.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(f.base64)) fail('파일 데이터가 올바르지 않습니다.');
    const data=Buffer.from(f.base64,'base64');
    if(data.toString('base64')!==f.base64) fail('파일 데이터가 올바르지 않습니다.');
    total+=data.length;
    if(data.length>5*1024*1024||total>10*1024*1024) fail('파일당 5MB, 합계 10MB까지 첨부할 수 있습니다.');
    // HTML/SVG 등 실행 가능한 형식은 미리보기하지 않고 다운로드로 제공합니다.
    let mime='application/octet-stream';
    if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) mime='image/png';
    else if(data[0]===255&&data[1]===216&&data[2]===255) mime='image/jpeg';
    else if(['GIF87a','GIF89a'].includes(data.subarray(0,6).toString())) mime='image/gif';
    else if(data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP') mime='image/webp';
    return {name:f.name,data,mime,size:data.length};
  });
}
async function attachments(c,postId,commentId,newFiles,removeIds=[]) {
  if(!Array.isArray(removeIds)) fail('첨부 삭제 목록을 확인해주세요.');
  const [old]=await c.query('SELECT id,file_size FROM community_attachment WHERE post_id=? AND comment_id <=> ?',[postId,commentId]);
  const remove=new Set(removeIds.map(id));
  if([...remove].some(n=>!old.some(f=>Number(f.id)===n))) fail('삭제할 첨부파일이 이 글에 속하지 않습니다.');
  const keep=old.filter(f=>!remove.has(Number(f.id)));
  if(keep.length+newFiles.length>5||keep.reduce((s,f)=>s+f.file_size,0)+newFiles.reduce((s,f)=>s+f.size,0)>10*1024*1024) fail('첨부파일은 최대 5개, 합계 10MB입니다.');
  for(const n of remove) await c.query('DELETE FROM community_attachment WHERE id=?',[n]);
  for(const f of newFiles) await c.query('INSERT INTO community_attachment (post_id,comment_id,original_name,mime_type,file_size,file_data) VALUES (?,?,?,?,?,?)',[postId,commentId,f.name,f.mime,f.size,f.data]);
}
async function present(c,rows,userId,kind) {
  if(!rows.length) return [];
  const postIds=[...new Set(rows.map(r=>kind==='post'?r.id:r.postId))];
  const [aliases]=await c.query('SELECT post_id,employee_id,anonymous_number FROM community_anonymous WHERE post_id IN (?)',[postIds]);
  const [attached]=await c.query('SELECT id,post_id,comment_id,original_name AS name,mime_type AS mimeType,file_size AS size FROM community_attachment WHERE post_id IN (?)',[postIds]);
  return rows.map(row=>{
    const postId=kind==='post'?row.id:row.postId;
    const isOwner=String(row.authorId)===String(userId);
    const isAnonymous=!!row.isAnonymous;
    const alias=aliases.find(a=>String(a.post_id)===String(postId)&&String(a.employee_id)===String(row.authorId));
    const deleted=!!row.isDeleted;
    return {...row, isOwner, isAnonymous, anonymousNumber:isAnonymous?alias?.anonymous_number:null,
      authorId:deleted||isAnonymous&&!isOwner?null:row.authorId,
      authorName: deleted
      ? '삭제된 댓글'
      : isAnonymous
        ? (kind === 'post' ? '익명' : '익명' + (alias?.anonymous_number || ''))
        : row.authorName,
      content:deleted?'삭제된 댓글입니다.':row.content,
      attachments:deleted?[]:attached.filter(f=>String(f.post_id)===String(postId)&&(kind==='post'?f.comment_id===null:String(f.comment_id)===String(row.id))).map(({post_id,comment_id,...f})=>f)
    };
  });
}
const postSelect=`SELECT p.id,p.board_name AS boardName,p.title,p.content,p.author_id AS authorId,e.employee_name AS authorName,p.is_anonymous AS isAnonymous,p.created_at AS createdAt,p.updated_at AS updatedAt,p.is_resolved AS isResolved FROM community_post p LEFT JOIN employees e ON e.employee_id=p.author_id`;
const commentSelect=`SELECT c.id,c.post_id AS postId,c.author_id AS authorId,e.employee_name AS authorName,c.is_anonymous AS isAnonymous,c.parent_id AS parentId,c.is_deleted AS isDeleted,c.content,c.created_at AS createdAt,c.updated_at AS updatedAt FROM community_comment c LEFT JOIN employees e ON e.employee_id=c.author_id`;
async function postResult(c,postId,userId) { const [rows]=await c.query(postSelect+' WHERE p.id=?',[postId]); return (await present(c,rows,userId,'post'))[0]; }
async function lockPost(c,postId) { const [rows]=await c.query('SELECT * FROM community_post WHERE id=? FOR UPDATE',[postId]); if(!rows.length) fail('게시글이 없습니다.',404); return rows[0]; }
for(const router of [posts,comments,files]) router.use(session,requireUser);
posts.get('/',wrap(async(req,res)=>{
  const page=id(req.query.page||1); const where=[]; const values=[];
  if(req.query.boardName&&req.query.boardName!=='전체'){where.push('p.board_name=?');values.push(req.query.boardName);}
  if(req.query.keyword){where.push('(p.title LIKE ? OR p.content LIKE ?)');values.push('%'+req.query.keyword+'%','%'+req.query.keyword+'%');}
  const sql=where.length?' WHERE '+where.join(' AND '):'';
  const [count]=await db.query('SELECT COUNT(*) AS n FROM community_post p'+sql,values);
  const [rows]=await db.query(postSelect+sql+' ORDER BY p.created_at DESC,p.id DESC LIMIT 10 OFFSET ?',[...values,(page-1)*10]);
  res.json({posts:await present(db,rows,req.communityUser.id,'post'),total:Number(count[0].n),page,totalPages:Math.ceil(count[0].n/10)});
}));
posts.post('/',wrap(async(req,res)=>{
  const title=text(req.body.title,200),content=text(req.body.content,10000),board=req.body.boardName;
  if(!['자유게시판','질문 답변','정보공유'].includes(board)) fail('게시판을 확인해주세요.');
  const anon=anonymous(req.body.isAnonymous), incoming=decodeFiles(req.body.files);
  const post=await transaction(async c=>{
    const [result]=await c.query('INSERT INTO community_post (board_name,title,content,author_id,is_anonymous) VALUES (?,?,?,?,?)',[board,title,content,req.communityUser.id,anon]);
    const postId=result.insertId;
    if(anon) await numberFor(c,postId,req.communityUser.id);
    await attachments(c,postId,null,incoming);
    return postResult(c,postId,req.communityUser.id);
  });
  res.status(201).json({post});
}));
posts.put('/:id',wrap(async(req,res)=>{
  const postId=id(req.params.id),title=text(req.body.title,200),content=text(req.body.content,10000),incoming=decodeFiles(req.body.files);
  const post=await transaction(async c=>{
    const old=await lockPost(c,postId);
    if(String(old.author_id)!==String(req.communityUser.id)) fail('본인 글만 수정할 수 있습니다.',403);
    const anon=anonymous(req.body.isAnonymous,!!old.is_anonymous);
    if(anon) await numberFor(c,postId,req.communityUser.id);
    await c.query('UPDATE community_post SET title=?,content=?,is_anonymous=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[title,content,anon,postId]);
    await attachments(c,postId,null,incoming,req.body.removeAttachmentIds);
    return postResult(c,postId,req.communityUser.id);
  }); res.json({post});
}));
posts.put('/:id/resolution',wrap(async(req,res)=>{
  const postId=id(req.params.id); if(![0,1].includes(req.body.isResolved)) fail('해결 상태를 확인해주세요.');
  const post=await transaction(async c=>{ const old=await lockPost(c,postId);
    if(String(old.author_id)!==String(req.communityUser.id)||old.board_name!=='질문 답변') fail('본인 질문만 변경할 수 있습니다.',403);
    await c.query('UPDATE community_post SET is_resolved=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[req.body.isResolved,postId]);
    return postResult(c,postId,req.communityUser.id);
  });res.json({post});
}));
posts.delete('/:id',wrap(async(req,res)=>{
  await transaction(async c=>{ const postId=id(req.params.id),old=await lockPost(c,postId);
    if(String(old.author_id)!==String(req.communityUser.id)) fail('본인 글만 삭제할 수 있습니다.',403);
    await c.query('DELETE FROM community_post WHERE id=?',[postId]);
  });res.json({message:'삭제되었습니다.'});
}));
comments.get('/mine',wrap(async(req,res)=>{
  const [rows]=await db.query(`SELECT c.id,c.post_id AS postId,c.content,c.created_at AS createdAt,p.title AS postTitle,p.board_name AS boardName FROM community_comment c JOIN community_post p ON p.id=c.post_id WHERE c.author_id=? AND c.is_deleted=0 ORDER BY c.created_at DESC,c.id DESC`,[req.communityUser.id]);res.json(rows);
}));
comments.get('/',wrap(async(req,res)=>{
  const [rows]=await db.query(commentSelect+' WHERE c.post_id=? ORDER BY c.created_at,c.id',[id(req.query.postId)]);
  res.json(await present(db,rows,req.communityUser.id,'comment'));
}));
comments.post('/',wrap(async(req,res)=>{
  const postId=id(req.body.postId),parentId=req.body.parentId==null?null:id(req.body.parentId),content=text(req.body.content,1000);
  const anon=anonymous(req.body.isAnonymous),incoming=decodeFiles(req.body.files),user=req.communityUser;
  const result=await transaction(async c=>{
    const post=await lockPost(c,postId);let parent;
    if(parentId){ const [rows]=await c.query('SELECT * FROM community_comment WHERE id=? AND post_id=?',[parentId,postId]);parent=rows[0];if(!parent||parent.parent_id!=null||parent.is_deleted) fail('답글 대상 댓글이 없습니다.'); }
    const n=anon?await numberFor(c,postId,user.id):null;
    const [saved]=await c.query('INSERT INTO community_comment (post_id,author_id,content,parent_id,is_anonymous) VALUES (?,?,?,?,?)',[postId,user.id,content,parentId,anon]);
    await attachments(c,postId,saved.insertId,incoming);
    return {id:saved.insertId,n,recipients:[post.author_id,parent?.author_id]};
  });
  // 익명 댓글의 알림에도 실명을 넣지 않습니다. 알림 실패로 댓글 등록을 실패 처리하지 않습니다.
  for(const recipient of new Set(result.recipients.filter(n=>n&&String(n)!==String(user.id)))) {
    try { await createNotification(recipient,'커뮤니티',(anon?'익명'+result.n:user.name)+'님이 댓글을 남겼어요.','/community/post/'+postId); } catch(e) { console.error('댓글 알림 실패:',e.code); }
  }
  res.status(201).json({id:result.id});
}));
for(const method of ['put','delete']) comments[method]('/:id',wrap(async(req,res)=>{
  const commentId=id(req.params.id),incoming=method==='put'?decodeFiles(req.body.files):[];
  const [found]=await db.query('SELECT post_id FROM community_comment WHERE id=?',[commentId]);if(!found.length) fail('댓글이 없습니다.',404);
  await transaction(async c=>{
    await lockPost(c,found[0].post_id);
    const [rows]=await c.query('SELECT * FROM community_comment WHERE id=? FOR UPDATE',[commentId]);const old=rows[0];
    if(!old||old.is_deleted||String(old.author_id)!==String(req.communityUser.id)) fail('본인 댓글만 변경할 수 있습니다.',403);
    if(method==='delete') {
      await c.query("UPDATE community_comment SET content='',is_deleted=1 WHERE id=?",[commentId]);
      await c.query('DELETE FROM community_attachment WHERE comment_id=?',[commentId]);
    } else {
      const anon=anonymous(req.body.isAnonymous,!!old.is_anonymous);
      if(anon) await numberFor(c,old.post_id,req.communityUser.id);
      await c.query('UPDATE community_comment SET content=?,is_anonymous=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',[text(req.body.content,1000),anon,commentId]);
      await attachments(c,old.post_id,commentId,incoming,req.body.removeAttachmentIds);
    }
  });res.json({message:'처리되었습니다.'});
}));
files.get('/:id',wrap(async(req,res)=>{
  const [rows]=await db.query('SELECT a.* FROM community_attachment a JOIN community_post p ON p.id=a.post_id LEFT JOIN community_comment c ON c.id=a.comment_id WHERE a.id=? AND (a.comment_id IS NULL OR c.is_deleted=0)',[id(req.params.id)]);
  if(!rows.length) fail('첨부파일이 없습니다.',404);
  const f=rows[0];res.set('X-Content-Type-Options','nosniff');res.set('Cache-Control','private, no-store');
  res.set('Content-Type',f.mime_type);res.set('Content-Disposition',"attachment; filename*=UTF-8''"+encodeURIComponent(f.original_name));res.send(f.file_data);
}));
function errorHandler(error,req,res,next) {
  console.error('커뮤니티 처리 오류:',error.code||error.message);
  res.status(error.status||500).json({message:error.status?error.message:'저장 또는 조회에 실패했습니다. DB 마이그레이션과 연결 설정을 확인해주세요.'});
}
for(const router of [posts,comments,files]) router.use(errorHandler);
module.exports={posts,comments,files,decodeFiles,numberFor,present};
