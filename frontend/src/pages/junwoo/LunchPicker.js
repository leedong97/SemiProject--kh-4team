// frontend/src/pages/junwoo/LunchPicker.js

import React, { useState } from "react";
import "./LunchPicker.css";

const categories = ["전체", "한식", "중식", "일식", "양식", "간편식"];

const menus = [
    { name: "김치찌개", category: "한식", emoji: "🍲", description: "뜨끈한 국물에 밥 한 공기!" },
    { name: "제육볶음", category: "한식", emoji: "🍚", description: "매콤한 제육으로 든든하게!" },
    { name: "비빔밥", category: "한식", emoji: "🥗", description: "여러 가지 나물을 골고루!" },
    { name: "불고기", category: "한식", emoji: "🥩", description: "달콤짭짤한 점심 한 끼!" },
    { name: "순두부찌개", category: "한식", emoji: "🍲", description: "부드러운 순두부와 얼큰한 국물!" },
    { name: "짜장면", category: "중식", emoji: "🍜", description: "오늘은 익숙하고 맛있는 짜장면!" },
    { name: "짬뽕", category: "중식", emoji: "🍜", description: "얼큰한 국물이 생각나는 날!" },
    { name: "볶음밥", category: "중식", emoji: "🍚", description: "고슬고슬하게 볶아낸 한 접시!" },
    { name: "마라탕", category: "중식", emoji: "🥘", description: "좋아하는 재료로 취향껏!" },
    { name: "돈카츠", category: "일식", emoji: "🍱", description: "바삭한 돈카츠로 기분 전환!" },
    { name: "초밥", category: "일식", emoji: "🍣", description: "한입씩 즐기는 깔끔한 점심!" },
    { name: "우동", category: "일식", emoji: "🍜", description: "따뜻한 국물과 쫄깃한 면발!" },
    { name: "카레라이스", category: "일식", emoji: "🍛", description: "향긋한 카레를 밥 위에 듬뿍!" },
    { name: "파스타", category: "양식", emoji: "🍝", description: "오늘은 파스타 한 접시 어때요?" },
    { name: "피자", category: "양식", emoji: "🍕", description: "동료들과 함께 나눠 먹어요!" },
    { name: "햄버거", category: "양식", emoji: "🍔", description: "한입 가득 즐기는 점심!" },
    { name: "샌드위치", category: "간편식", emoji: "🥪", description: "간편하게 즐기는 한 끼!" },
    { name: "김밥", category: "간편식", emoji: "🍙", description: "바쁜 날에도 든든하게!" },
    { name: "샐러드", category: "간편식", emoji: "🥗", description: "신선한 채소로 산뜻하게!" },
    { name: "토스트", category: "간편식", emoji: "🍞", description: "따뜻하고 바삭하게 즐겨요!" }
];

function LunchPicker() {
    const [category, setCategory] = useState("전체");
    const [selectedMenu, setSelectedMenu] = useState(null);

    function changeCategory(event) {
        setCategory(event.target.value);
        setSelectedMenu(null);
    }

    function pickMenu() {
        const candidates = menus.filter(function (menu) {
            return category === "전체" || menu.category === category;
        });

        // 연속으로 같은 메뉴가 나오지 않도록 제외
        const differentMenus = candidates.filter(function (menu) {
            return menu.name !== selectedMenu?.name;
        });

        const pool = differentMenus.length > 0 ? differentMenus : candidates;

        if (pool.length === 0) {
            setSelectedMenu(null);
            return;
        }

        const randomIndex = Math.floor(Math.random() * pool.length);
        setSelectedMenu(pool[randomIndex]);
    }

    return (
        <section className="lunch-picker" aria-label="점심 메뉴 추천">
            <span className="lunch-picker-label">오늘의 작은 고민 해결</span>

            <h2 className="lunch-picker-title">오늘 점심 뭐 먹지? 🍱</h2>

            <p className="lunch-picker-description">
                고민될 땐 메뉴를 뽑아보세요!
            </p>

            <label className="lunch-picker-filter">
                <span>음식 종류</span>

                <select value={category} onChange={changeCategory}>
                    {categories.map(function (item) {
                        return (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        );
                    })}
                </select>
            </label>

            <div
                className="lunch-picker-result"
                aria-live="polite"
                aria-atomic="true"
            >
                <span className="lunch-picker-emoji" aria-hidden="true">
                    {selectedMenu ? selectedMenu.emoji : "🍽️"}
                </span>

                <strong className="lunch-picker-menu">
                    {selectedMenu ? selectedMenu.name : "오늘의 메뉴는?"}
                </strong>

                <p className="lunch-picker-message">
                    {selectedMenu
                        ? selectedMenu.description
                        : "아래 버튼을 눌러 확인해보세요."}
                </p>

                {selectedMenu && (
                    <span className="lunch-picker-badge">
                        {selectedMenu.category}
                    </span>
                )}
            </div>

            <button
                type="button"
                className="lunch-picker-button"
                onClick={pickMenu}
            >
                {selectedMenu ? "다른 메뉴 뽑기 ↻" : "점심 메뉴 뽑기"}
            </button>

            <p className="lunch-picker-note">
                동료들과 함께 오늘의 메뉴를 정해보세요.
            </p>
        </section>
    );
}

export default LunchPicker;