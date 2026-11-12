import SearchInput from "../../../shared/SearchInput";
// 검색칸 + 선택 드롭다운(게시판, 정렬 등)을 한 줄로 보여주는 필터 바.
// 프로젝트 관리 · 인원 관리 · 커뮤니티 관리가 같이 쓴다.
//
// searchId / placeholder / search / onSearchChange : 검색칸
// selects : [{ id, label, value, onChange, options: [{ value, label }] }] 드롭다운 목록 (순서대로 표시)
export default function SearchSortBar({ searchId, placeholder, search, onSearchChange, selects = [] }) {
    return (
      <div className="nexus-member-toolbar">
        <div className="nexus-member-field nexus-member-field-search">
          <label htmlFor={searchId}>검색</label>
          <SearchInput
            id={searchId}
            className="nexus-member-search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
  
        {selects.map((select) => (
          <div key={select.id} className="nexus-member-field">
            <label htmlFor={select.id}>{select.label}</label>
            <select
              id={select.id}
              className="nexus-member-sort"
              value={select.value}
              onChange={(e) => select.onChange(e.target.value)}
            >
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }