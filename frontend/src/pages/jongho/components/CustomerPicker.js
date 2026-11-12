import { useEffect, useMemo, useRef, useState } from "react";

export default function CustomerPicker({ id, value, customers = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const options = useMemo(() => {
    const query = value.trim().toLocaleLowerCase();
    return customers
      .filter((customer) => !query || customer.name.toLocaleLowerCase().includes(query))
      .slice(0, 8);
  }, [customers, value]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  return (
    <div className="nexus-customer-picker" ref={rootRef}>
      <input
        type="text"
        className="nexus-project-input"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        required
      />
      {open && (
        <div className="nexus-customer-options" id={`${id}-options`} role="listbox">
          {options.length ? options.map((customer) => (
            <button
              type="button"
              className="nexus-customer-option"
              key={customer.id == null ? customer.name : customer.id}
              role="option"
              aria-selected={customer.name === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(customer.name);
                setOpen(false);
              }}
            >
              <span>{customer.name}</span>
              <small>{customer.status === "견적문의" ? "견적 문의 기업" : "등록 고객사"}</small>
            </button>
          )) : (
            <p className="nexus-customer-empty">일치하는 고객사가 없습니다. 입력한 이름으로 등록됩니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
