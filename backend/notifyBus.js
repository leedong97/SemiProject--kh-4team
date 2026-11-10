// 알림 "방송국": 알림이 저장되면 여기로 "누구에게 새 알림이 왔어요"를 방송하고,
// 알림 실시간 연결(SSE, members/woojin/notifications.js 의 /stream)이 이 방송을 듣고 화면에 알려줘요.
// 서버 한 대 안에서만 동작하는 단순한 방식이에요. (서버가 여러 대로 늘어나면 Redis 같은 공용 방송이 필요해요)
const { EventEmitter } = require("events");

const bus = new EventEmitter();
// 접속한 직원 한 명당 듣는 귀(listener) 하나가 붙어요. 기본 한도(10개)를 넘으면 경고가 나므로 제한을 풀어요.
bus.setMaxListeners(0);

module.exports = bus;
