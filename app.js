function processFiles() {
    const groupFile = document.getElementById('groupFile').files[0];
    const hostelFile = document.getElementById('hostelFile').files[0];

    if (!groupFile || !hostelFile) {
        alert('Please upload both CSV files.');
        return;
    }

    Promise.all([readFile(groupFile), readFile(hostelFile)]).then(([groupData, hostelData]) => {
        const groupInfo = parseCSV(groupData);
        const hostelInfo = parseCSV(hostelData);
        const allocations = allocateRooms(groupInfo, hostelInfo);
        displayAllocations(allocations);
    });
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

function parseCSV(data) {
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj;
        }, {});
    });
}

function allocateRooms(groups, hostels) {
    const allocations = [];
    const hostelMap = {};

    hostels.forEach(hostel => {
        const key = `${hostel['Hostel Name']}-${hostel['Gender']}`;
        if (!hostelMap[key]) {
            hostelMap[key] = [];
        }
        hostelMap[key].push({ roomNumber: hostel['Room Number'], capacity: Number(hostel['Capacity']), allocated: 0 });
    });

    groups.forEach(group => {
        const groupSize = Number(group['Members']);
        const groupGender = group['Gender'].includes('Girls') ? 'Girls' : 'Boys';
        const key = `${groupGender === 'Boys' ? 'Boys Hostel A' : 'Girls Hostel B'}-${groupGender}`;
        const hostelRooms = hostelMap[key];

        for (let room of hostelRooms) {
            if (room.allocated + groupSize <= room.capacity) {
                allocations.push({
                    'Group ID': group['Group ID'],
                    'Hostel Name': key.split('-')[0],
                    'Room Number': room.roomNumber,
                    'Members Allocated': groupSize
                });
                room.allocated += groupSize;
                break;
            }
        }
    });

    return allocations;
}

function displayAllocations(allocations) {
    const tbody = document.getElementById('outputTable').querySelector('tbody');
    tbody.innerHTML = '';
    allocations.forEach(allocation => {
        const row = document.createElement('tr');
        Object.values(allocation).forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
}

function downloadCSV() {
    const allocations = Array.from(document.querySelectorAll('#outputTable tbody tr')).map(row => {
        return Array.from(row.cells).map(cell => cell.textContent).join(',');
    });
    const csvContent = "Group ID,Hostel Name,Room Number,Members Allocated\n" + allocations.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'allocations.csv';
    link.click();
}
