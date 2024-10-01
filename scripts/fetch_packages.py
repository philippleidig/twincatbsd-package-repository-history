import requests
import zstandard as zstd
import tarfile
import os
import shutil
import json
import re
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urljoin


REPOSITORY_URL = 'https://tcbsd.beckhoff.com/TCBSD/14/stable/packages/'

PACKAGESITE_TZST = 'packagesite.tzst'
PACKAGESITE_HTML = 'packagesite.html'
PACKAGESITE_TZST_PATH = 'packagesite.tzst'
PACKAGESITE_TAR_PATH = 'packagesite.tar'
PACKAGESITE_YAML_PATH = 'packagesite.yaml'
PACKAGESITE_JSON_PATH = 'packagesite.json'
TEMP_PATH = 'temp'

PACKAGES_PATH = '..\packagehistory.json'
README_PATH = "..\README.md"

def load_json_file(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)
    else:
        print(f"WARNING: The file {file_path} does not exist.")
        return None
    
def save_json_file(output_data, output_path):
    """Speichert die aktualisierten JSON-Daten in die Datei."""
    with open(output_path, 'w') as output_file:
        json.dump(output_data, output_file, indent=4)
        print(f"Updated {output_path} successfully.")

def update_output_json(packagesite_data, output_data, repo_version, repo_date, freebsd_version, packages_count):
    # Debugging-Ausgabe
    print(f"Updating output JSON with version: {repo_version} and date: {repo_date}")

    # Add build information if the version doesn't exist
    if repo_version not in output_data['builds']:
        # Add new build at the beginning of the dictionary
        today = datetime.today().strftime('%Y-%m-%d')
        new_build = {repo_version: {"release_date": repo_date, "freebsd_version": freebsd_version, "packages_count": packages_count, "update_date": today}}
        output_data['builds'] = {**new_build, **output_data['builds']}
        print(f"Added new build version {repo_version} with release date {repo_date} to builds.")

    # Update the packages section
    for package_name, package_info in packagesite_data.items():
        package_version = package_info['version']

        # Check if the package exists in output.json
        if package_name not in output_data['packages']:
            # Add new package with its version
            output_data['packages'][package_name] = {'versions': {repo_version: package_version}}
            print(f"Added new package {package_name} with version {package_version} under build {repo_version}.")
        else:
            # Update the existing package
            existing_versions = output_data['packages'][package_name]['versions']
            if repo_version not in existing_versions:
                # Add the new version for this build
                existing_versions[repo_version] = package_version
                print(f"Added version {package_version} for package {package_name} under build {repo_version}.")
                
                # Sort the existing versions in descending order
                sorted_versions = dict(sorted(existing_versions.items(), key=lambda x: x[0], reverse=True))
                output_data['packages'][package_name]['versions'] = sorted_versions
            else:
                print(f"Package {package_name} already has version {package_version} for build {repo_version}.")
    
    return output_data




def integrate_packagesite_into_output(packagesite_path, output_path, repo_version, repo_date, freebsd_version, packages_count):

    # Load data from packagesite.json
    packagesite_data = load_json_file(packagesite_path)
    if not packagesite_data:
        print(f"Failed to load {packagesite_path}. Aborting integration.")
        return

    # Load data from output.json
    output_data = load_json_file(output_path)
    if not output_data:
        print(f"Failed to load {output_path}. Aborting integration.")
        return

    # Update output.json with the new packagesite data
    updated_output = update_output_json(packagesite_data, output_data, repo_version, repo_date, freebsd_version, packages_count)

    save_json_file(updated_output, output_path)


def fetch_html(url):
    response = requests.get(url)
    if response.status_code == 200:
        return BeautifulSoup(response.text, 'html.parser')
    else:
        raise Exception(f"Error loading URL {url}: {response.status_code}")

def validate_date(date_str):
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def validate_version(version_str):
    return version_str.isdigit()

def extract_repository_metadata(soup):
    topbar_table = soup.find('table', {'id': 'topbartable'})
    if not topbar_table:
        raise ValueError("Topbar table not found.")

    rows = topbar_table.find_all('tr')
    if len(rows) < 3:
        raise ValueError("Not enough rows in the topbar table.")

    repo_date = rows[1].find_all('td')[1].text.strip()
    if not validate_date(repo_date):
        raise ValueError(f"Invalid date format: {repo_date}")

    repo_version = rows[2].find_all('td')[1].text.strip()
    if not validate_version(repo_version):
        raise ValueError(f"Invalid version format: {repo_version}")
    
    freebsd_verison = rows[0].find_all('td')[1].text.strip()

    packages_count = rows[3].find_all('td')[1].text.strip()

    return repo_date, repo_version, freebsd_verison, packages_count

def get_build_information(url):
    soup = fetch_html(url)
    return extract_repository_metadata(soup)

def rename_yaml_to_json(yaml_path, new_name):
    """Renames the packagesite.yaml file to a JSON file with date and version number."""
    if os.path.exists(yaml_path):
        shutil.move(yaml_path, new_name)
        print(f'Renamed {yaml_path} to {new_name} successfully.')
    else:
        print(f'WARNING: {yaml_path} not found.')

def fix_json_syntax(file_path):
    """Reads the file, fixes the JSON syntax, and saves it in a corrected format."""
    # Step 1: Read the file and correct syntax
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Adds brackets to close the array
    corrected_content = '[' + content.replace('}\n{', '},{') + ']'

    try:
        # Step 2: Parse JSON data
        parsed_json = json.loads(corrected_content)

        # Step 3: Convert to Key-Value format
        converted_dict = {item['name']: item for item in parsed_json}
        
        # Step 4: Save the JSON file in the new format
        with open(file_path, 'w') as corrected_file:
            json.dump(converted_dict, corrected_file, indent=2)
        
        print(f'Formatted JSON saved as packagesite.json successfully.')
        
    except json.JSONDecodeError as e:
        print(f"Error while parsing JSON: {e}")

def sort_json_content_in_file(file_path):
    """Sorts the JSON content in the specified file alphabetically by keys."""
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            # Load the content of the JSON file
            data = json.load(file)

        # Sort the data alphabetically based on the keys
        sorted_data = dict(sorted(data.items(), key=lambda item: item[0].lower()))

        # Save the sorted data back into the file
        with open(file_path, 'w') as outfile:
            json.dump(sorted_data, outfile, indent=4)

        print(f"The data in '{file_path}' has been sorted alphabetically.")
    else:
        print(f"WARNING: The file '{file_path}' does not exist.")

def download_file(url, path):
    """Downloads a file from the given URL."""
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(path, 'wb') as file:
                file.write(response.content)
            print(f'File downloaded successfully: {path}')
            return True
        else:
            print(f'ERROR downloading: {response.status_code}')
            print(f'Response content: {response.text}')
            return False
    except Exception as e:
        print(f'ERROR downloading file from {url}: {e}')
        return False

def decompress_file(compressed_path, tar_path):
    """Decompresses a .tzst file into a .tar file."""
    try:
        with open(compressed_path, 'rb') as compressed_file:
            dctx = zstd.ZstdDecompressor()
            with open(tar_path, 'wb') as uncompressed_file:
                dctx.copy_stream(compressed_file, uncompressed_file)
        print(f'File decompressed successfully: {tar_path}')
        return True
    except Exception as e:
        print(f'ERROR decompressing {compressed_path}: {e}')
        return False

def extract_tar_file(tar_path, extract_to):
    """Extracts a .tar file into the specified directory."""
    try:
        with tarfile.open(tar_path, 'r') as tar:
            tar.extractall(path=extract_to)
        print(f'Files extracted successfully to: {extract_to}')
        return True
    except Exception as e:
        print(f'ERROR extracting {tar_path}: {e}')
        return False
    
def set_environment_variable(name, value):
    if 'GITHUB_ENV' in os.environ:
        print(f"Setting environment variable {name}={value}")
        with open(os.getenv('GITHUB_ENV'), 'a') as github_env:
            github_env.write(f"{name}={value}\n")
    else:
        print(f"Skipped setting {name} as this is not running in a GitHub Action.")

def delete_folder_recursively(folder_path):
    if os.path.exists(folder_path) and os.path.isdir(folder_path):
        shutil.rmtree(folder_path)
        print(f"Folder '{folder_path}' has been successfully deleted.")
    else:
        print(f"Folder '{folder_path}' does not exist or is not a directory.")

def move_file(source_path, destination_path):
    if os.path.exists(source_path) and os.path.isfile(source_path):
        shutil.move(source_path, destination_path)
        print(f"File '{source_path}' has been successfully moved to '{destination_path}'.")
    else:
        print(f"Source file '{source_path}' does not exist or is not a file.")

def sort_json_packages(file_path):
    # Check if the provided file exists and is a JSON file
    if not os.path.isfile(file_path) or not file_path.endswith('.json'):
        print("The specified file is invalid or does not exist.")
        return

    with open(file_path, 'r') as file:
        # Load the content of the JSON file
        data = json.load(file)

    # Sort the "packages" object alphabetically based on the keys
    if "packages" in data:
        # Sort the outer "packages" dictionary by keys
        sorted_packages = dict(sorted(data["packages"].items(), key=lambda item: item[0].lower()))
        
        # Replace the original packages with the sorted packages
        data["packages"] = sorted_packages

    # Save the sorted data back to the file
    with open(file_path, 'w') as outfile:
        json.dump(data, outfile, indent=4)

    print(f"The 'packages' in '{file_path}' have been sorted alphabetically.")

def read_readme(file_path):
    """Reads the content of the README.md file."""
    with open(file_path, 'r') as file:
        return file.read()

def write_readme(file_path, content):
    """Writes the updated content back to the README.md file."""
    with open(file_path, 'w') as file:
        file.write(content)

def append_to_markdown_table(existing_table, build, release_date, freebsd_version, package_count, update_date):
    """Appends a new row to the existing Markdown table."""
    new_row = f"| {build} | {release_date} | {freebsd_version} | {package_count} | {update_date} |\n"
    return existing_table + new_row

def update_table_in_readme(file_path, build, release_date, freebsd_version, package_count, update_date):
    """Finds the table in the README.md, renames the column header, and extends the table."""
    # Read the README file
    content = read_readme(file_path)
    
    # Regex pattern to identify the table with the old column header 'Pipeline Run'
    table_pattern = re.compile(r"(\| Build\s*\|\s*Release Date\s*\|\s*FreeBSD Version\s*\|\s*Package Count\s*\|\s*Update Date\s*\|\n\|[-|]+\|\n(?:\|.*\|\n)*)")
    
    # Search for the table in the content
    match = table_pattern.search(content)
    
    if match:
        # Found table content
        existing_table = match.group(1)

        # Append a new row to the table
        updated_table = append_to_markdown_table(existing_table, build, release_date, freebsd_version, package_count, update_date)
        
        # Replace the old table with the updated table in the content
        updated_content = content.replace(existing_table, updated_table)
        
        # Write the updated content back to the README file
        write_readme(file_path, updated_content)
        print("The table has been successfully updated, and the column header renamed.")
    else:
        print("No matching table found in the README.md file.")



def run():

    tzst_url = urljoin(REPOSITORY_URL, PACKAGESITE_TZST)
    html_url = urljoin(REPOSITORY_URL, PACKAGESITE_HTML)

    print(tzst_url)
    print(html_url)

    # Download and parse packagesite.html for build version and date
    repo_date, repo_version, freebsd_version, packages_count = get_build_information(html_url)

    # Set build meta data as environment variables
    set_environment_variable("REPOSITORY_DATE", repo_date)
    set_environment_variable("REPOSITORY_BUILD", repo_version)

    print(f"Date: {repo_date} Build: {repo_version} FreeBSD Version: {freebsd_version} Packages: {packages_count}")

    # Extract the packagesite.yaml file from packagesite.tar 
    if not os.path.exists(TEMP_PATH):
        os.makedirs(TEMP_PATH)  # Create directory if it doesn't exist

    tzst_path = os.path.join(TEMP_PATH, PACKAGESITE_TZST_PATH)
    tar_path = os.path.join(TEMP_PATH, PACKAGESITE_TAR_PATH)

    #  Download the packagesite.tzst file
    if not download_file(tzst_url, tzst_path):
        return

    # Decompress the packagesite.tzst file into a packagesite.tar file
    if not decompress_file(tzst_path, tar_path):
        return

    if not extract_tar_file(tar_path, TEMP_PATH):
        return

    yaml_path = os.path.join(TEMP_PATH, PACKAGESITE_YAML_PATH)
    json_path = os.path.join(TEMP_PATH, PACKAGESITE_JSON_PATH)

    # Rename yaml to json 
    rename_yaml_to_json(yaml_path, json_path)

    # Fix invalid json syntax
    fix_json_syntax(json_path)

    # sort packages alphabetically in ascending order
    sort_json_content_in_file(json_path)

    # update packages.json with new package version
    integrate_packagesite_into_output(json_path, PACKAGES_PATH, repo_version, repo_date, freebsd_version, packages_count)

    # sort new added packages alphabetically in ascending order
    sort_json_packages(json_path)

    # move packagesite.json from temp folder
    packagesite_path = os.path.join("..\\", PACKAGESITE_JSON_PATH)
    move_file(json_path, packagesite_path)

    # delete temp folder recursively
    delete_folder_recursively(TEMP_PATH)

    today = datetime.today().strftime('%Y-%m-%d')   
    update_table_in_readme(README_PATH, repo_version, repo_date, freebsd_version, packages_count, today)

    print('Process completed successfully!')


run()
