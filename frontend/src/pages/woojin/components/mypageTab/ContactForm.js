import { useEffect, useState } from "react";
import axios from "axios";

// 연락처 입력 기준
const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;
const MAX_ADDRESS_LENGTH = 100;

// 연락처·주소 수정 폼
function ContactForm({ user }) {
    const [form, setForm] = useState({ phone: "", address: "" });
    const [msg, setMsg] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user.isDummy) return;
        axios
            .get("http://localhost:3333/api/profile", { params: { employeeId: user.id } })
            .then((res) => setForm({ phone: res.data.phone || "", address: res.data.address || "" }))
            .catch(() => setMsg({ type: "error", text: "연락처를 불러오지 못했어요." }));
    }, [user.id, user.isDummy]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setMsg(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const phone = form.phone.trim();
        const address = form.address.trim();

        if (phone !== "" && !PHONE_PATTERN.test(phone)) {
            setMsg({ type: "error", text: "전화번호 형식을 확인해 주세요. 예) 010-1234-5678" });
            return;
        }
        if (address.length > MAX_ADDRESS_LENGTH) {
            setMsg({ type: "error", text: `주소는 ${MAX_ADDRESS_LENGTH}자 이하로 입력해 주세요.` });
            return;
        }

        setSaving(true);
        axios
            .put("http://localhost:3333/api/profile", { employeeId: user.id, phone, address })
            .then((res) => {
                setForm({ phone: res.data.phone || "", address: res.data.address || "" });
                setMsg({ type: "ok", text: "저장했어요." });
            })
            .catch((err) => {
                const text = err.response && err.response.data && err.response.data.message;
                setMsg({ type: "error", text: text || "저장하지 못했어요. 잠시 후 다시 시도해 주세요." });
            })
            .finally(() => setSaving(false));
    };

    if (user.isDummy) {
        return <p className="mp-note">연락처는 로그인한 뒤에 입력할 수 있어요.</p>;
    }

    return (
        <>
            <h3>연락처</h3>
            <form className="mp-info" onSubmit={handleSubmit}>
                <label>
                    전화번호
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="010-1234-5678"
                        autoComplete="tel"
                    />
                </label>
                <label>
                    주소
                    <input
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="예) 서울특별시 강남구 테헤란로 1"
                        autoComplete="street-address"
                    />
                </label>

                {msg && <p className={msg.type === "ok" ? "mp-ok" : "mp-error"}>{msg.text}</p>}

                <button type="submit" className="mp-submit" disabled={saving}>
                    {saving ? "저장 중..." : "연락처 저장"}
                </button>
            </form>
        </>
    );
}

export default ContactForm;
