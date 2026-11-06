// 재직 중인 직원을 팀원으로 추가하고, 선택한 직원을 확인하거나 제거합니다.
export default function EmployeePicker({
  employees = [],
  selectedIds = [],
  excludedId,
  lockedEmployee,
  lockedLabel = "담당자",
  selectClassName,
  emptyMessage,
  onAdd,
  onRemove
}) {
  const activeEmployees = employees.filter((employee) => employee.status === "재직");
  const isExcluded = (employee) => String(employee.id) === String(excludedId);
  const isSelected = (employee) => selectedIds.includes(employee.id);

  const availableEmployees = activeEmployees.filter(
    (employee) => !isSelected(employee) && !isExcluded(employee)
  );
  const selectedEmployees = activeEmployees.filter(
    (employee) => isSelected(employee) && !isExcluded(employee)
  );

  return (
    <>
      <select
        className={selectClassName}
        value=""
        onChange={(event) => event.target.value && onAdd(Number(event.target.value))}
      >
        <option value="">팀원을 선택하면 추가됩니다</option>
        {availableEmployees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name} ({employee.rank} · {employee.position})
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        {selectedEmployees.length === 0 && emptyMessage && <p>{emptyMessage}</p>}
        {lockedEmployee && (
          <span
            style={{
              display: "inline-flex",
              gap: "6px",
              padding: "4px 10px",
              border: "1px solid #999",
              borderRadius: "14px",
              margin: "0 6px 6px 0"
            }}
          >
            {lockedEmployee.name} ({lockedLabel})
          </span>
        )}
        {selectedEmployees.map((employee) => (
          <span
            key={employee.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              border: "1px solid #ccc",
              borderRadius: "14px",
              margin: "0 6px 6px 0"
            }}
          >
            {employee.name} ({employee.rank})
            <button type="button" onClick={() => onRemove(employee.id)}>×</button>
          </span>
        ))}
      </div>
    </>
  );
}
