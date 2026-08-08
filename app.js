

---

#### 3. `app.js`
Логика запросов к AniList и управление интерфейсом.

```javascript
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const animeGrid = document.getElementById('animeGrid');
const modal = document.getElementById('playerModal');
const closeModal = document.querySelector('.close-modal');

// GraphQL запрос к AniList
async function searchAnime(query) {
    const graphqlQuery = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        id
        title { romaji english }
        coverImage { large }
        description
        averageScore
      }
    }
    `;

    const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: graphqlQuery,
            variables: { search: query }
        })
    });

    const data = await response.json();
    return data.data.Media;
}

// Функция отрисовки карточек
function displayAnime(animeList) {
    animeGrid.innerHTML = '';
    if (!animeList) {
        animeGrid.innerHTML = '<p>Ничего не найдено</p>';
        return;
    }

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        const title = anime.title.english || anime.title.romaji;

        card.innerHTML = `
            <img src="${anime.coverImage.large}" alt="${title}">
            <div class="anime-card-info">
                <h3>${title}</h3>
                <p>⭐ ${anime.averageScore || 'N/A'}</p>
            </div>
        `;

        card.onclick = () => openPlayer(anime);
        animeGrid.appendChild(card);
    });
}

// Функция открытия плеера
function openPlayer(anime) {
    const title = anime.title.english || anime.title.romaji;
    const desc = anime.description;

    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalDesc').innerText = desc.replace(/<[^>]*>?/gm, ''); // Очистка HTML тегов

    // Трюк для плеера: используем сторонний сервис (например, Kodik или подобные)
    // ВНИМАНИЕ: В реальности здесь должна быть ссылка на плеер, работающую с ID из AniList.
    // Для примера используем заглушку. Многие используют поиск по названию в сторонних API.
    const playerContainer = document.getElementById('playerContainer');
    playerContainer.innerHTML = `
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe>
    `;
    // Подсказка: Для реального плеера обычно используют: `https://api.provider.com/embed/${anime.id}`

    modal.style.display = "block";
}

// События
searchBtn.onclick = async () => {
    const query = searchInput.value;
    if (!query) return;
    animeGrid.innerHTML = '<p>Загрузка...</p>';
    const results = await searchAnime(query);
    displayAnime(results);
};

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

closeModal.onclick = () => {
    modal.style.display = "none";
    document.getElementById('playerContainer').innerHTML = ''; // Остановить видео при закрытии
};

window.onclick = (event) => {
