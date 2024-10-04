var packages = {};

function createDependencyTree(packageName) {
  if (!packages[packageName]) {
      console.error(`Package "${packageName}" not found.`);
      return document.createElement('ul');
  }

  const ul = document.createElement('ul');
  const deps = packages[packageName].deps || {};

  if (Object.keys(deps).length > 0) {
      for (const depName in deps) {
          const depVersion = deps[depName].version;
          const subTree = createCollapsibleDependency(depName, depVersion);
          ul.appendChild(subTree);
      }
  }

  return ul;
}

function createCollapsibleDependency(packageName, depVersion) {
  const li = document.createElement('li');

  const header = document.createElement('div');
  header.classList.add('title'); 

  const deps = packages[packageName].deps || {};
  const hasDependencies = Object.keys(deps).length > 0;

  let arrow;
  if (hasDependencies) {
      header.classList.add('collapsible'); 

      arrow = document.createElement('span');
      arrow.classList.add('arrow', 'collapsed'); 
      arrow.textContent = '▶'; 
      header.appendChild(arrow);
  } else {
      arrow = document.createElement('span');
      arrow.classList.add('arrow'); 
      header.appendChild(arrow);
  }

  const title = document.createElement('span');
  title.textContent = `${packageName} (Version: ${depVersion})`;

  header.appendChild(title);
  li.appendChild(header);

  if (hasDependencies) {
      const content = document.createElement('div');
      content.classList.add('dependency-content');

      const subTree = createDependencyTree(packageName);
      content.appendChild(subTree);

      li.appendChild(content);

      header.addEventListener('click', function () {
          const isCollapsed = content.style.display === 'none' || content.style.display === '';
          content.style.display = isCollapsed ? 'block' : 'none';
          arrow.classList.toggle('collapsed', !isCollapsed);
          arrow.classList.toggle('expanded', isCollapsed);
      });
  }

  return li;
}

function renderDependencyTree(rootPackage) {
  const treeContainer = document.getElementById('package-info-deps');
  treeContainer.innerHTML = '';

  const deps = packages[rootPackage].deps || {};

  if (Object.keys(deps).length === 0) {
      const noDepsMessage = document.createElement('p');
      noDepsMessage.textContent = "No Dependencies";
      treeContainer.appendChild(noDepsMessage);
  } else {
      const tree = createDependencyTree(rootPackage);
      treeContainer.appendChild(tree);

      const topLevelItems = tree.querySelectorAll('.dependency-content');
      topLevelItems.forEach(item => item.style.display = 'none');
  }
}

async function fetchCommitsFromBranch() {
  const owner = 'philippleidig'; 
  const repo = 'twincatbsd-repository-history'; 
  const branch = 'main'; 
  const searchTerm = ''; 

  //const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const commits = await response.json();

    const filteredCommits = commits.filter(commit =>
      commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

function updatePackageInfo(package) {

  const name = document.getElementById('package-info-name');
  const comment = document.getElementById('package-info-comment');
  const maintainer = document.getElementById('package-info-maintainer');
  const architecture = document.getElementById('package-info-arch');
  const details = document.getElementById('package-info-comment-details');
  const deps = document.getElementById('package-info-deps');

  if (!package) {

    name.innerHTML = 'Package not found in current repository.';
    comment.innerHTML = '';
    maintainer.innerHTML = '';
    architecture.innerHTML = '';
    details.innerHTML = '';
    deps.innerHTML = '';

    return;
  }

  name.innerHTML = package.name;
  comment.innerHTML = package.comment;
  maintainer.innerHTML = package.maintainer;
  architecture.innerHTML = package.arch;
  details.innerHTML = package.desc;

  renderDependencyTree(package.name);
}

async function fetchCommitsFromBranch() {
  const owner = 'philippleidig'; 
  const repo = 'twincatbsd-repository-history'; 
  const branch = 'main'; 
  const searchTerm = ''; 

  const url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${branch}`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const commits = await response.json();

      const filteredCommits = commits.filter(commit =>
          commit.commit.message.toLowerCase().includes(searchTerm.toLowerCase())
      );

      console.log('Gefilterte Commits:', filteredCommits);
      const commitList = document.getElementById('commitList');
      commitList.innerHTML = ''; 

      filteredCommits.forEach(commit => {
          const listItem = document.createElement('li');
          listItem.textContent = `SHA: ${commit.sha}, Message: ${commit.commit.message}`;
          commitList.appendChild(listItem);
      });

  } catch (error) {
      console.error('Error fetching commits:', error);
  }
}

async function fetchFileFromCommit() {
  const owner = 'philippleidig'; 
  const repo = 'twincatbsd-repository-history'; 
  const filePath = 'packagesite.html'; 
  const commitSHA = 'ea2166ac1a0a6b171455fbfd370d3a8825487f1e'; 

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${commitSHA}`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const fileContent = atob(data.content);

      console.log(fileContent); 
     // document.getElementById('fileContent').innerText = fileContent;
  } catch (error) {
      console.error('Error fetching file:', error);
  }
}

async function fetchPackageInfo() {

  const owner = 'philippleidig'; 
  const repo = 'twincatbsd-repository-history'; 
  const filePath = 'packagesite.json';

  let url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  if (isDevelop()) {
    url = '../packagesite.json'
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const jsonData = await response.json();
  return jsonData;
}

function createComboBox(packageName, packageData) {
  const combobox = document.getElementById('package-info-version');
  combobox.innerHTML = '';

  const versionSet = new Set();
  let packageFound = false;

  for (let i = 0; i < packageData.length; i++) {
      if (packageData[i] === packageName) {
          packageFound = true;
          while (i + 1 < packageData.length && !isNaN(packageData[i + 1][0])) {
              const version = packageData[++i];

              if (version && version !== ' - ' && !versionSet.has(version)) {
                  versionSet.add(version);
                  const option = document.createElement('option');
                  option.value = version;
                  option.textContent = version;
                  combobox.appendChild(option);
              }
          }
          break;
      }
  }

  if (!packageFound) {
      const noOption = document.createElement('option');
      noOption.textContent = "No versions available";
      noOption.disabled = true;
      combobox.appendChild(noOption);
  }
}



document.getElementById('package-info-version').addEventListener('change', function () {
  const selectedVersion = this.value;
  console.log(`Selected version: ${selectedVersion}`);

});

function onSelectedPackageChanged(event, row) {

  const rows = document.querySelectorAll('#table tbody tr');
  rows.forEach(r => r.classList.remove('selected')); 
  event.target.classList.add('selected'); 


  const rowData = row.cells.map(cell => cell.data);
  const packageName = rowData[0];

  const package = packages[packageName];
  updatePackageInfo(package);

  createComboBox(packageName, rowData);
}

async function fetchDataAndRenderTable() {

  try {

    const owner = 'philippleidig'; 
    const repo = 'twincatbsd-repository-history'; 
    const filePath = 'packagehistory.json'; 

    let url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    if (isDevelop()) {
      url = '../packagehistory.json'
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const jsonData = await response.json();

    const buildNumbers = Object.keys(jsonData.builds);  
    const headers = ['Package']; 

    // Sort build numbers in descending order
    buildNumbers.reverse();

    buildNumbers.forEach(buildNumber => {
      const releaseDate = jsonData.builds[buildNumber].release_date;
      headers.push(`${buildNumber} (${releaseDate})`);
    });

    const data = Object.keys(jsonData.packages).map(packageName => {
      const row = [packageName];  
      const versions = jsonData.packages[packageName].versions;

      buildNumbers.forEach(buildNumber => {
        const version = versions[buildNumber] || ' - ';
        row.push(version);
      });

      return row;
    });

    const grid = new gridjs.Grid({
      columns: headers,
      data: data,
      pagination: {
        limit: 100,
        summary: false
      },
      autoWidth: true,
      sort: true,
      fixedHeader: true,
      height: window.innerHeight - 200,
      search: true,
      language: {
        'search': {
          'placeholder': '🔍 Search...'
        },
      }
    });


    var isInitialized = false;

    // grid.js bugfix
    grid.config.store.subscribe(function tableStatesListener(state, prevState) {
      if (prevState.status < state.status) {
        if (prevState.status === 2 && state.status === 3) {

          if(isInitialized){
            return;
          }

          // auto sort packages by name
          const column = document.querySelector('[data-column-id="package"]');
          column.click();

          // auto select first row
          const firstRow = document.querySelector('#table tbody tr');
          firstRow.click();

          isInitialized = true;
        }
      }
    });

    grid.render(document.getElementById("table"));
    grid.on('rowClick', onSelectedPackageChanged);

  } catch (error) {
    console.error('Fehler beim Abrufen der JSON-Daten:', error);
  }
}

async function onDocumentReady() {
  packages = await fetchPackageInfo();

  await fetchDataAndRenderTable();
}

document.addEventListener('DOMContentLoaded', onDocumentReady);
