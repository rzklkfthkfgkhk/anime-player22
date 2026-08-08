const ANILIST_API = 'https://anilist.co';
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const catalogHeading = document.getElementById('catalog-heading');
const logo = document.getElementById('logo');

const playerSection = document.getElementById('player-section');
const playerTitle = document.getElementById('player-title');
const videoPlayer = document.getElementById('video-player');
const animeInfo = document.getElementById('anime-info');
const closePlayerBtn = document.getElementById('close-player');

// Оптимизированный GraphQL-скрипт запроса
const animeQuery = `
query ($search: String, $perPage: Int) {
  Page(perPage: $perPage) {
    media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      idMal
      title {
        romaji
        english
        userPreferred
      }
      coverImage {
        large
      }
      startDate {
        year
      }
      description
    }
  }
}`;

// Функция GET-запроса через URL-параметры (успешно обходит CORS на локальном ПК)
async function fetchAnime(searchQuery = null) {
    animeGrid.innerHTML = '<div class="loader">Синхронизация с AniList...</div>';
    
    const variables = { perPage: 24 };
    if (searchQuery) {
        variables.search = searchQuery;
    }

    // Кодируем GraphQL запрос в формат URL-GET параметров
    const url = `${ANILIST_API}?query=${encodeURIComponent(animeQuery)}&variables=${encodeURIComponent(JSON.stringify(variables))}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Ошибка соединения. Статус: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error("Крическая ошибка структуры данных:", data.errors);
            animeGrid.innerHTML = '<div class="loader" style="color: #ff4a4a;">Ошибка обработки структуры API AniList.</div>';
            return;
        }

        renderAnimeList(data.data.Page.media);
    } catch (error) {
        console.error("Потеряно соединение:", error);
        animeGrid.innerHTML = `
            <div class="loader" style="color: #ff4a4a; font-size: 14px; text-align: left; max-width: 600px; margin: 0 auto;">
                <strong>Ошибка сетевого подключения к серверам AniList!</strong><br><br>
                <span>Возможные причины:</span><br>
                1. Локальные ограничения браузера на выполнение внешних скриптов.<br>
                2. Сторонние плагины или AdBlock блокируют поддомены Graphql.<br><br>
                <strong>Решение:</strong> Перетащите папку с сайтом на бесплатную платформу <a href="https://netlify.com" target="_blank" style="color:#45f3ff;">Netlify Drop</a>. Сайт запустится на удаленном сервере и всё заработает мгновенно.
            </div>`;
    }
}

function renderAnimeList(animeList) {
    animeGrid.innerHTML = '';
    if (!animeList || animeList.length === 0) {
        animeGrid.innerHTML = '<div class="loader">Ничего не найдено.</div>';
        return;
    }

    animeList.forEach(anime => {
        const title = anime.title.english || anime.title.romaji || anime.title.userPreferred;
        const card = document.createElement('div');
        card.className = 'anime-card';
        
        card.innerHTML = `
            <img src="${anime.coverImage.large}" alt="${title}" loading="lazy">
            <div class="anime-card-info">
                <div class="anime-card-title">${title}</div>
                <div class="anime-card-year">${anime.startDate.year || '—'}</div>
            </div>
        `;

        card.addEventListener('click', () => openPlayer(anime));
        animeGrid.appendChild(card);
    });
}

function openPlayer(anime) {
    const title = anime.title.english || anime.title.romaji || anime.title.userPreferred;
    playerTitle.textContent = title;
    
    // Подгрузка бесплатного плеера без токенов по ID Shikimori/MAL
    if (anime.idMal) {
        videoPlayer.src = `https://delivembed.cc{anime.idMal}`;
    } else {
        videoPlayer.src = `https://delivembed.cc{encodeURIComponent(anime.title.romaji)}`;
    }

    animeInfo.innerHTML = `
        <div style="margin-top: 15px; font-size: 14px;">
            <strong>Сюжетная линия (ENG):</strong><br>
            ${anime.description ? anime.description : 'Описание отсутствует.'}
        </div>
    `;

    playerSection.classList.remove('hidden');
    window.scrollTo({ top: playerSection.offsetTop - 90, behavior: 'smooth' });
}

closePlayerBtn.addEventListener('click', () => {
    playerSection.classList.add('hidden');
    videoPlayer.src = ''; 
});

searchBtn.addEventListener('click', () => {
    const text = searchInput.value.trim();
    if (text) {
        catalogHeading.textContent = `Результаты поиска по: "${text}"`;
        fetchAnime(text);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

logo.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    catalogHeading.textContent = 'Популярное аниме';
    fetchAnime();
});

// Первичный вызов пула популярных тайтлов
fetchAnime();
