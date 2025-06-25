document.addEventListener("DOMContentLoaded", function () {
    const openBtn = document.getElementById("openFilter");
    const closeBtn = document.getElementById("closeFilter");
    const modal = document.getElementById("filterModal");

    openBtn.addEventListener("click", () => {
        modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    const buildingButtons = document.querySelectorAll(".building-item");

    buildingButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const detail = document.getElementById(targetId);
            const arrow = btn.querySelector(".arrow");

            const isOpen = detail.classList.contains("open");

            // すでに開いている要素を閉じる処理
            document.querySelectorAll(".building-detail.open").forEach(openDetail => {
                if (openDetail !== detail) {
                    openDetail.style.maxHeight = openDetail.scrollHeight + "px"; // 一度設定しないとアニメが効かない
                    requestAnimationFrame(() => {
                        openDetail.style.maxHeight = "0px";
                        openDetail.classList.remove("open"); // すぐには消さない
                    });
                }
            });

            document.querySelectorAll(".arrow").forEach(a => {
                if (a !== arrow) a.textContent = "▼";
            });

            if (isOpen) {
                // 閉じるアニメーション
                detail.style.maxHeight = detail.scrollHeight + "px";
                requestAnimationFrame(() => {
                    detail.style.maxHeight = "0px";
                });

                detail.addEventListener("transitionend", function handler(e) {
                    if (e.propertyName === "max-height") {
                        detail.classList.remove("open");
                        detail.removeEventListener("transitionend", handler);
                    }
                });

                arrow.textContent = "▼";
            } else {
                // 開くアニメーション
                detail.classList.add("open");
                detail.style.maxHeight = detail.scrollHeight + "px";
                arrow.textContent = "▲";
            }
        });
    });


    function openDetail(element) {
        // 最初に open クラスを追加してスタイル適用
        element.classList.add("open");

        // 一旦 max-height を auto にしてから、0 に戻す（リセット）
        element.style.maxHeight = "0px";

        // 少し待ってから scrollHeight を取得（スタイルが適用されるのを待つ）
        setTimeout(() => {
            const fullHeight = element.scrollHeight;
            element.style.maxHeight = fullHeight + "px";
        }, 50); // ← 50ms 待つと安定します（ブラウザによっては10msでもOKですが）
    }

    function closeDetail(element) {
        // 高さを0に → CSSアニメーションが走る
        element.style.maxHeight = "0px";

        // アニメーション終了後に open クラスを外す（必要なら）
        setTimeout(() => {
            element.classList.remove("open");
        }, 300); // ← CSSの transition の duration と合わせて！
    }

    // 全てクリアボタンの処理
    const clearBtn = document.querySelector(".clear-btn");

    clearBtn.addEventListener("click", () => {
        // select要素をすべて「選択」に戻す
        document.querySelectorAll(".filter-modal select").forEach(select => {
            select.selectedIndex = 0;

            // クラスも初期状態に戻す
            select.classList.add("default");
            select.classList.remove("filled");
        });

        // チェックボックスをすべてオフにする
        document.querySelectorAll(".filter-modal input[type='checkbox']").forEach(checkbox => {
            checkbox.checked = false;
        });
    });

        document.querySelectorAll('.filter-modal select').forEach(select => {
        function updateSelectStyle() {
            if (select.value === "選択") {
                select.classList.add("default");
                select.classList.remove("filled");
            } else {
                select.classList.add("filled");
                select.classList.remove("default");
            }
        }

        // 初期状態のチェック
        updateSelectStyle();

        // 選択が変更されたら見た目を更新
        select.addEventListener("change", updateSelectStyle);
    });

    

});