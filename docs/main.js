
async function fetchCommitsFromBranch() {
  const owner = 'philippleidig'; // GitHub Benutzername
  const repo = 'twincatbsd-repository-history'; // Name des Repos
  const branch = 'main'; // Der Branch, von dem du die Commits abfragen möchtest
  const searchTerm = ''; // Der Begriff, nach dem in Commit-Nachrichten gesucht wird

  //const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const commits = await response.json();

    // Filtern nach Commits, die den Suchbegriff in der Commit-Nachricht enthalten
    const filteredCommits = commits.filter(commit =>
      commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ausgabe der gefilterten Commits
    console.log('Gefilterte Commits:', filteredCommits);
    // const commitList = document.getElementById('commitList');
    // commitList.innerHTML = ''; // Leeren der Liste vor dem Hinzufügen

    // filteredCommits.forEach(commit => {
    //     const listItem = document.createElement('li');
    //    listItem.textContent = `SHA: ${commit.sha}, Message: ${commit.commit.message}`;
    //    commitList.appendChild(listItem);
    // });

  } catch (error) {
    console.error('Error fetching commits:', error);
  }
}

function isDevelop() {
  return window.location.href === 'http://localhost:8000/docs/index.html';
}

// Funktion, um JSON-Daten asynchron von GitHub abzurufen
async function fetchDataAndRenderTable() {

  try {

    const owner = 'philippleidig'; // GitHub Benutzername
    const repo = 'twincatbsd-repository-history'; // Name des Repos
    const filePath = 'packagehistory.json'; // Pfad zur Datei

    let url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    if (isDevelop()) {
      url = '../packagehistory.json'
    }

    // Die URL zu deiner JSON-Datei auf GitHub
    const response = await fetch(url);

    // Überprüfen, ob der Abruf erfolgreich war
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // JSON-Daten aus dem Response parsen
    const jsonData = await response.json();

    // Builds für den Header (Buildnummer + Release Datum)
    const buildNumbers = Object.keys(jsonData.builds);  // Alle Buildnummern sammeln
    const headers = [{ title: 'Package' }];  // Starten mit "Package Name"

    // Sort build numbers in descending order
    buildNumbers.reverse();

    // Die Header der Tabelle werden durch die Builds ergänzt
    buildNumbers.forEach(buildNumber => {
      const releaseDate = jsonData.builds[buildNumber].release_date;
      headers.push({ title: `${buildNumber} (${releaseDate})` });
    });

    // Daten für die Tabelle zusammenstellen
    const data = Object.keys(jsonData.packages).map(packageName => {
      const row = [packageName];  // Paketname als erste Spalte
      const versions = jsonData.packages[packageName].versions;

      // Für jede Buildnummer die entsprechende Version einfügen oder "N/A"
      buildNumbers.forEach(buildNumber => {
        const version = versions[buildNumber] || ' - ';
        row.push(version);
      });

      return row;
    });

    const dataTable = new DataTable('#table', {
      columns: headers,
      fixedColumns: true,
      scrollX: true,
      scrollY: 400,
      data: data
    });

    dataTable.on('select', (e, dt, type, indexes) => {
      console.log(e);
    })

    // new gridjs.Grid({
    //   columns: headers,
    //   data: data,
    //   pagination: {
    //     limit: 100,
    //     summary: false
    //   },
    //   autoWidth: true,
    //   sort: true,
    //   fixedHeader: true,
    //   search: true
    // }).render(document.getElementById("wrapper"));

  } catch (error) {
    console.error('Fehler beim Abrufen der JSON-Daten:', error);
  }
}

document.addEventListener('DOMContentLoaded', fetchDataAndRenderTable);
