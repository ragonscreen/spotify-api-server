'use strict';

const DATA_TYPE = 'albums';

const init = async () => {
    await generateAccessToken();

    try {
        const projects = await getProjects();
        projects.map((item) => {
            createProject(item);
        });
        console.log(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
    }
};

document.addEventListener('DOMContentLoaded', init);

const generateAccessToken = async () => {
    const options = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    };

    const response = await fetch('/api', options);
    const data = await response.json();
    console.log(data);
};

const getProjects = async () => {
    const url = `/data/${DATA_TYPE}`;
    const response = await fetch(url);
    const data = await response.json();

    const promises = data.map(async (item, index) => {
        const projectData = await getProjectData(item.spotifyID);
        return processProject(projectData, item, index);
    });

    const projects = await Promise.all(promises);
    return projects;
};

const getProjectData = async (spotifyID) => {
    const projectUrl = `/project/${spotifyID}`;
    const response = await fetch(projectUrl);
    return await response.json();
};

const processProject = (data, item, index) => {
    const {
        name,
        artists,
        images,
        total_tracks: totalTracks,
        release_date: releaseDate,
        tracks,
        external_urls: url,
    } = data;

    item.rank = index + 1;
    item.title = name;
    item.artists = formatArtists(artists);
    item.cover = images[0].url;
    item.trackCount = totalTracks;
    item.releaseYear = parseInt(releaseDate.slice(0, 4));
    item.duration = formatDuration(tracks.items);
    item.link = url.spotify ?? 'https://open.spotify.com/';
    return item;
};

const formatArtists = (arr) => {
    const artists = [];
    arr.map((e) => artists.push(e.name));
    return artists;
};

const formatDuration = (arr) => {
    let durationMs = 0;
    arr.map((e) => (durationMs += parseInt(e['duration_ms'])));
    return durationMs;
};

const container = document.querySelector('.container');

const createProject = (project) => {
    const element = document.createElement('div');
    element.classList.add('project');
    const html = `
    <div class="cover-container">
        <img src="${project.cover}" alt="${
        project.title
    } album cover" class="cover" />
    </div>
    <div class="info">
        <h2 class="title">${project.title}</h2>
        <p class="artists">${project.artists.join(', ')}</p>
        <div class="extras">
            <p class="release-year">${project.releaseYear}</p>
            <p class="track-count">${project.trackCount}</p>
            <p class="duration">${msToMin(project.duration)}</p>
        </div>
    </div>`;
    element.innerHTML = html;
    container.appendChild(element);
};

const msToMin = (milliseconds) => {
    let seconds = Math.floor(milliseconds / 1000);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    let formattedTime = '';

    if (hours > 0) formattedTime += `${hours}h `;
    if (minutes > 0) formattedTime += `${minutes}m`;
    return formattedTime || '0m';
};
