import { API_BASE } from '../../../../shared/config';
import { useEffect, useState } from "react";
import axios from "axios";

// 전화번호 모양 검사: 010-1234-5678 / 01012345678 / 011-123-4567 처럼 숫자 10~11자리
// 왜 화면에서도 검사하나요? 서버까지 가기 전에 바로 알려 줘서 빠르고 친절해요.
// (하지만 진짜 검사는 서버에서도 한 번 더 해요. 브라우저 검사는 누구나 우회할 수 있어서요)
const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;
const MAX_ADDRESS_LENGTH = 100; // 주소 최대 글자 수

// 내 연락처(전화번호, 주소)를 보여 주고 고칠 수 있는 폼
function ContactForm({ user }) {
    const [form, setForm] = useState({ phone: "", address: "" });
    const [msg, setMsg] = useState(null); // { type: "ok" | "error", text }
    const [saving, setSaving] = useState(false);

    // 처음 열릴 때 서버에서 내 전화번호·주소를 가져와요
    useEffect(() => {
        if (user.isDummy) return; // 로그인 없이 들어온 더미 사용자는 가져올 정보가 없어요
        axios
            .get(`${API_BASE}/api/profile`, { params: { employeeId: user.id } })
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
            .put(`${API_BASE}/api/profile`, { employeeId: user.id, phone, address })
            .then((res) => {
                // 서버가 보기 좋게 고쳐 준 값(예: 하이픈 추가)으로 화면을 맞춰요
                setForm({ phone: res.data.phone || "", address: res.data.address || "" });
                setMsg({ type: "ok", text: "저장했어요." });
            })
            .catch((err) => {
                const text = err.response && err.response.data && err.response.data.message;
                setMsg({ type: "error", text: text || "저장하지 못했어요. 잠시 후 다시 시도해 주세요." });
            })
            .finally(() => setSaving(false));
    };

    // 로그인하지 않고 주소로 바로 들어온 경우(더미 사용자)에는 저장할 대상이 없어요
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
