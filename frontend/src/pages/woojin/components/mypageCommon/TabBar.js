function TabBar({ tab, setTab, TABS }) {
    return (
        <div className="mp-tabs">
            {TABS.map((name) => (
                <button
                    key={name}
                    type="button"
                    className={tab === name ? "mp-tab active" : "mp-tab"}
                    onClick={() => setTab(name)}
                >
                    {name}
                </button>
            ))}
        </div>
    );
}

export default TabBar;
