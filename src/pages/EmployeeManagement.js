
import { useEffect, useState } from "react";

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEmployees = async () => {
    try {
      setError("");

      const response = await fetch(
        "http://localhost:3001/api/employees"
      );

      if (!response.ok) {
        throw new Error("직원 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <div style={{ padding: "32px" }}>
      <h1>직원 관리</h1>
      <p>직원 정보를 조회하고 관리합니다.</p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "32px",
          marginBottom: "20px",
        }}
      >
        <h2>직원 목록 ({employees.length}명)</h2>

        <button
          onClick={() => alert("직원 추가 기능은 다음 단계에서 구현합니다.")}
        >
          + 직원 추가
        </button>
      </div>

      {loading ? (
        <p>직원 목록을 불러오는 중입니다...</p>
      ) : error ? (
        <p>{error}</p>
      ) : employees.length === 0 ? (
        <p>등록된 직원이 없습니다. 직원을 추가해 주세요.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              {["사번", "이름", "부서", "직급", "이메일", "전화번호"].map(
                (heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "14px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => (
              <tr key={employee.employee_id}>
                {[
                  employee.employee_id,
                  employee.employee_name,
                  employee.employee_department,
                  employee.employee_position,
                  employee.employee_email,
                  employee.employee_phone,
                ].map((value, index) => (
                  <td
                    key={index}
                    style={{
                      padding: "14px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {value || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EmployeeManagement;
