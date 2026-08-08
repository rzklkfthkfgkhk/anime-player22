const ANILIST_API = 'https://anilist.co';
const animeGrid = document.getElementById('anime-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const catalogHeading = document.getElementById('catalog-heading');
const logo = document.getElementById('logo');

// Элементы плеера
const playerSection = document.getElementById('player-section');
const playerTitle = document.getElementById('player-title');
const videoPlayer = document.getElementById('video-player');
const animeInfo = document.getElementById('anime-info');
const closePlayerBtn = document.getElementById('close-player');

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

async function fetchAnime(searchQuery = null) {
    animeGrid.innerHTML = '<div class="loader">Загрузка аниме...</div>';
    
    const variables = { perPage: 24 };
    if (searchQuery) {
        variables.search = searchQuery;
    }

    try {
        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                query: animeQuery,
                variables: variables
            })
        });

        // Проверяем, ответил ли сервер успехом (код 200-299)
        if (!response.ok) {
            throw new Error(`Сервер ответил со статусом ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error("Ошибки AniList API:", data.errors);
            animeGrid.innerHTML = '<div class="loader" style="color: #ff4a4a;">Ошибка синтаксиса AniList. Подробности в консоли (F12).</div>';
            return;
        }

        renderAnimeList(data.data.Page.media);
    } catch (error) {
        console.error("Сетевая ошибка:", error);
        
        // Показываем конкретную техническую ошибку на экране для диагностики
        animeGrid.innerHTML = `
            <div class="loader" style="color: #ff4a4a; font-size: 14px; line-height: 1.8;">
                <strong>Ошибка сетевого запроса!</strong><br>
                Подробности: ${error.message}<br><br>
                <span style="color: #fff; font-size: 13px;">
                    💡 <strong>Как исправить:</strong><br>
                    1. Если вы открыли файл как <code>file:///...</code>, браузер мог заблокировать запрос. Попробуйте загрузить папку на бесплатный хостинг (например, <a href="https://github.com" target="_blank" style="color: #45f3ff;">GitHub Pages</a> или Netlify).<br>
                    2. Убедитесь, что у вас отключены строгие блокировщики рекламы (AdBlock) или VPN, которые могут блокировать запросы к домену graphql.anilist.co.
                </span>
            </div>
        `;
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
    
    if (anime.idMal) {
        videoPlayer.src = `https://delivembed.cc{anime.idMal}`;
    } else {
        videoPlayer.src = `https://delivembed.cc{encodeURIComponent(anime.title.romaji)}`;
    }

    animeInfo.innerHTML = `
        <div class="anime-description">
            <strong>Описание (ENG):</strong> <br>
            ${anime.description ? anime.description : 'Описание отсутствует.'}
        </div>
    `;

    playerSection.classList.remove('hidden');
    window.scrollTo({ top: playerSection.offsetTop - 100, behavior: 'smooth' });
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

fetchAnime();
