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

// GraphQL запрос для получения трендов или поиска
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

// Функция отправки запроса к AniList
async function fetchAnime(searchQuery = null) {
    animeGrid.innerHTML = '<div class="loader">Загрузка аниме...</div>';
    
    const variables = {
        perPage: 24
    };
    if (searchQuery) variables.search = searchQuery;

    try {
        const response = await fetch(ANILIST_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: animeQuery,
                variables: variables
            })
        });

        const data = await response.json();
        renderAnimeList(data.data.Page.media);
    } catch (error) {
        console.error("Ошибка при работе с AniList API:", error);
        animeGrid.innerHTML = '<div class="loader" style="color: #ff4a4a;">Ошибка загрузки. Попробуйте еще раз.</div>';
    }
}

// Отображение карточек на странице
function renderAnimeList(animeList) {
    animeGrid.innerHTML = '';
    
    if (animeList.length === 0) {
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

        card.addEventListener('click', () => {
            openPlayer(anime);
        });

        animeGrid.appendChild(card);
    });
}

// Открытие плеера при клике на аниме
function openPlayer(anime) {
    const title = anime.title.english || anime.title.romaji || anime.title.userPreferred;
    playerTitle.textContent = title;
    
    // Бесплатный плеер по базе Shikimori ID (idMal в AniList равен ID на MyAnimeList и Shikimori)
    // Используем авторитетный плеер-агрегатор, не требующий токенов
    if (anime.idMal) {
        videoPlayer.src = `https://delivembed.cc{anime.idMal}`;
    } else {
        // Запасной вариант по названию, если ID отсутствует
        videoPlayer.src = `https://delivembed.cc{encodeURIComponent(anime.title.romaji)}`;
    }

    animeInfo.innerHTML = `
        <div class="anime-description">
            <strong>Описаниe (ENG):</strong> <br>
            ${anime.description ? anime.description : 'Описание отсутствует.'}
        </div>
    `;

    playerSection.classList.remove('hidden');
    window.scrollTo({ top: playerSection.offsetTop - 100, behavior: 'smooth' });
}

// События
closePlayerBtn.addEventListener('click', () => {
    playerSection.classList.add('hidden');
    videoPlayer.src = ''; // Останавливаем воспроизведение при закрытии
});

searchBtn.addEventListener('click', () => {
    const text = searchInput.value.trim();
    if (text) {
        catalogHeading.textContent = `Результаты поиска по: "${text}"`;
        fetchAnime(text);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

logo.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = '';
    catalogHeading.textContent = 'Популярное аниме';
    fetchAnime();
});

// Первая загрузка трендов при открытии страницы
fetchAnime();
