export function matchesProjectSearch(project, search) {
    const keyword = search.toLowerCase();

    return (
        (project.name || '').toLowerCase().includes(keyword) ||
        (project.customer || '').toLowerCase().includes(keyword)
    );
}
