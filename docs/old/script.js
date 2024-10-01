document.addEventListener("DOMContentLoaded", function (event) {
    document.getElementById('search').addEventListener('keyup', function () {
        let filter = this.value.toLowerCase();
        let rows = document.querySelectorAll('#dataTable tbody tr');

        rows.forEach(row => {
            let cells = row.getElementsByTagName('td');
            let match = Array.from(cells).some(cell =>
                cell.textContent.toLowerCase().includes(filter)
            );
            row.style.display = match ? '' : 'none';
        });
    });

    let rows = document.querySelectorAll('#dataTable tbody tr');

    rows.forEach(row => {
        row.addEventListener("click", function (e) {
            const target = e.currentTarget;
            const packageName = target.querySelectorAll("td")[0].textContent.trim();

            console.log(packageName);
        });
    });

    var firstRow = rows[0];
    firstRow.click();

});

let packages = {};
let url = "https://raw.githubusercontent.com/philippleidig/twincatbsd-repository-history/refs/heads/main/packagesite.json";

fetch(url)
    .then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.text();
    })
    .then(text => {

        packages = JSON.parse(text);
        console.log(packages);

    })
    .catch(error => {
        console.error(error);
    });






