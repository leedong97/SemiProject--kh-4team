import Pagination from "../../../shared/Pagination";

export default function NumberedPager({ currentPage, total, pageSize = 10, onPage }) {
    return <Pagination total={total} currentPage={currentPage} pageSize={pageSize} onPage={onPage} />;
}
