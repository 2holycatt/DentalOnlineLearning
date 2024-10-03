// import Chart from 'chart.js/auto'
import Subject from "../../models/subjects.js";

const chartData11 = window.chartData2; // รับข้อมูลจาก EJS ที่ฝังไว้ใน script

async function findSubject(_id) {
    const findSubject = await Subject.findById(_id);
    return findSubject;
}
console.log(findSubject(chartData11));
document.getElementById('dashboardSelector').addEventListener('change', function () {
    // ดึงค่าของ option ที่ถูกเลือก
    const selectedValue = this.value;
    // ส่งคำร้องขอไปยังเส้นทางที่กำหนด
    window.location.href = selectedValue;
});

// let arr = chartData11.split(",");
// console.log(typeof arr);
// console.log(arr);
// for (let i = 0; i < arr.length;) {
//     console.log(arr[i].subjectName);
//     i++;
// }

const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar', // ประเภทของแผนภูมิ เช่น 'bar', 'line', 'pie', 'doughnut' ฯลฯ
    data: {
        labels: ['Python', 'Java', 'C++', 'Node.js', 'PHP', 'HTML5'], // ป้ายของข้อมูล
        datasets: [{
            label: 'บทเรียน',
            data: [100, 20, 39, 79, 91, 50], // ข้อมูลของแผนภูมิ
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 191)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'บทเรียน', // ป้ายกำกับแกน X
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน X
                        family: 'Noto Sans Thai, sans-serif'
                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน X
                        family: 'Noto Sans Thai, sans-serif'

                    }
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'จำนวนความสำเร็จ', // ป้ายกำกับแกน Y
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน Y
                        family: 'Noto Sans Thai, sans-serif'

                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน Y
                        family: 'Noto Sans Thai, sans-serif'
                    }
                }
            }
        }
    }
});

const ctx2 = document.getElementById('myChart2').getContext('2d');
const myChart2 = new Chart(ctx2, {
    type: 'pie', // ประเภทของแผนภูมิเปลี่ยนเป็น 'pie'
    data: {
        labels: ['Python', 'Java', 'C++', 'Node.js', 'PHP', 'HTML5'], // ป้ายของข้อมูล
        datasets: [{
            label: 'บทเรียน',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // ไม่รักษาอัตราส่วนเดิม
        plugins: {
            legend: {
                position: 'left', // เปลี่ยนตำแหน่งของ legend เป็นด้านขวา
                align: 'start', // ให้ label เรียงเป็น block ในแนวตั้ง
                labels: {
                    boxWidth: 20, // กำหนดความกว้างของกล่องสีใน legend
                    padding: 15 // กำหนดระยะห่างระหว่างกล่องสีและข้อความ
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        let total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                        let percentage = ((context.raw / total) * 100).toFixed(2);
                        label += `${context.raw} (${percentage}%)`;
                        return label;
                    }
                }
            }
        }
    }
});

const ctx3 = document.getElementById('myScatterChart').getContext('2d');
const myScatterChart = new Chart(ctx3, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'JavaScript',
            data: [{
                x: 30,
                y: 78
            },
            {
                x: 25,
                y: 85
            },
            {
                x: 35,
                y: 90
            },
            {
                x: 45,
                y: 70
            },
            {
                x: 40,
                y: 88
            },
            {
                x: 32,
                y: 74
            },
            {
                x: 28,
                y: 80
            },
            {
                x: 33,
                y: 65
            },
            {
                x: 37,
                y: 90
            },
            {
                x: 29,
                y: 77
            },
            {
                x: 34,
                y: 82
            },
            {
                x: 38,
                y: 79
            },
            {
                x: 42,
                y: 85
            },
            {
                x: 36,
                y: 91
            },
            {
                x: 31,
                y: 76
            }
            ],
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 5
        },
        {
            label: 'Python',
            data: [{
                x: 20,
                y: 82
            },
            {
                x: 22,
                y: 70
            },
            {
                x: 25,
                y: 68
            },
            {
                x: 28,
                y: 92
            },
            {
                x: 30,
                y: 85
            },
            {
                x: 23,
                y: 74
            },
            {
                x: 27,
                y: 79
            },
            {
                x: 26,
                y: 85
            },
            {
                x: 29,
                y: 67
            },
            {
                x: 21,
                y: 80
            },
            {
                x: 24,
                y: 77
            },
            {
                x: 19,
                y: 75
            },
            {
                x: 25,
                y: 88
            },
            {
                x: 22,
                y: 69
            },
            {
                x: 30,
                y: 84
            }
            ],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 5
        },
        {
            label: 'HTML5',
            data: [{
                x: 18,
                y: 70
            },
            {
                x: 20,
                y: 75
            },
            {
                x: 22,
                y: 80
            },
            {
                x: 24,
                y: 55
            },
            {
                x: 26,
                y: 90
            },
            {
                x: 19,
                y: 65
            },
            {
                x: 23,
                y: 60
            },
            {
                x: 25,
                y: 85
            },
            {
                x: 27,
                y: 72
            },
            {
                x: 21,
                y: 79
            },
            {
                x: 28,
                y: 68
            },
            {
                x: 24,
                y: 74
            },
            {
                x: 22,
                y: 77
            },
            {
                x: 29,
                y: 69
            },
            {
                x: 30,
                y: 86
            }
            ],
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            pointRadius: 5
        },
        {
            label: 'PHP',
            data: [{
                x: 15,
                y: 60
            },
            {
                x: 17,
                y: 65
            },
            {
                x: 20,
                y: 50
            },
            {
                x: 22,
                y: 75
            },
            {
                x: 25,
                y: 80
            },
            {
                x: 18,
                y: 55
            },
            {
                x: 21,
                y: 68
            },
            {
                x: 23,
                y: 73
            },
            {
                x: 19,
                y: 65
            },
            {
                x: 16,
                y: 70
            },
            {
                x: 20,
                y: 75
            },
            {
                x: 24,
                y: 69
            },
            {
                x: 22,
                y: 78
            },
            {
                x: 26,
                y: 82
            },
            {
                x: 28,
                y: 85
            }
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 5
        },
        {
            label: 'C++',
            data: [{
                x: 40,
                y: 50
            },
            {
                x: 42,
                y: 55
            },
            {
                x: 45,
                y: 60
            },
            {
                x: 48,
                y: 65
            },
            {
                x: 50,
                y: 70
            },
            {
                x: 41,
                y: 52
            },
            {
                x: 44,
                y: 58
            },
            {
                x: 46,
                y: 64
            },
            {
                x: 49,
                y: 68
            },
            {
                x: 43,
                y: 56
            },
            {
                x: 47,
                y: 63
            },
            {
                x: 45,
                y: 59
            },
            {
                x: 48,
                y: 66
            },
            {
                x: 50,
                y: 72
            },
            {
                x: 42,
                y: 54
            }
            ],
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            pointRadius: 5
        }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'เวลา (นาที)', // ป้ายกำกับแกน X
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน X
                        family: 'Noto Sans Thai, sans-serif'
                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน X
                        family: 'Noto Sans Thai, sans-serif'

                    }
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'คะแนน', // ป้ายกำกับแกน Y
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน Y
                        family: 'Noto Sans Thai, sans-serif'

                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน Y
                        family: 'Noto Sans Thai, sans-serif'
                    }
                }
            }
        },
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += `เวลา: ${context.raw.x} นาที, คะแนน: ${context.raw.y}`;
                        return label;
                    }
                }
            }
        }
    }
});



function updateScatterChart(selectedLesson) {
    // ตรวจสอบและปิด canvas เดิม (ถ้ามี)
    var existingChart = document.getElementById('myScatterChart');
    if (existingChart) {
        existingChart.remove(); // ลบ canvas เดิมออกจาก DOM
    }

    // สร้าง canvas ใหม่สำหรับแสดง scatter chart
    var newCanvas = document.createElement('canvas');
    newCanvas.id = 'myScatterChart';
    newCanvas.classList.add('h-auto', 'w-100', 'px-3', 'py-2');

    // เพิ่ม canvas ใหม่เข้าไปในตำแหน่งที่เหมาะสม
    var graphContainer = document.querySelector('.scatter-container');
    graphContainer.insertBefore(newCanvas, graphContainer.firstChild);

    // ปรับปรุงข้อมูลและแสดงผล scatter chart ใหม่
    var ctx3 = newCanvas.getContext('2d');
    var datasets = getLessonData(selectedLesson); // ดึงข้อมูลของบทเรียนที่เลือก
    console.log(datasets);
    var myScatterChart2 = new Chart(ctx3, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'เวลา (นาที)', // ป้ายกำกับแกน X
                        font: {
                            size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน X
                            family: 'Noto Sans Thai, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน X
                            family: 'Noto Sans Thai, sans-serif'

                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'คะแนน', // ป้ายกำกับแกน Y
                        font: {
                            size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน Y
                            family: 'Noto Sans Thai, sans-serif'

                        }
                    },
                    ticks: {
                        font: {
                            size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน Y
                            family: 'Noto Sans Thai, sans-serif'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += `เวลา: ${context.raw.x} นาที, คะแนน: ${context.raw.y}`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// ฟังก์ชันสำหรับดึงข้อมูลของแต่ละบทเรียน
function getLessonData(lesson) {
    var datasets = [];
    switch (lesson) {
        case 'JavaScript':
            datasets = [
                {
                    label: 'JavaScript',
                    data: [
                        { x: 30, y: 78 },
                        { x: 25, y: 85 },
                        { x: 35, y: 90 },
                        { x: 31, y: 82 },
                        { x: 33, y: 88 },
                        { x: 28, y: 79 },
                        { x: 29, y: 84 },
                        { x: 34, y: 89 },
                        { x: 32, y: 86 },
                        { x: 27, y: 81 },
                        { x: 26, y: 80 },
                        { x: 36, y: 91 },
                        { x: 32, y: 87 },
                        { x: 31, y: 83 },
                        { x: 30, y: 77 }
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 5
                }
            ];
            break;
        case 'Python':
            datasets = [
                {
                    label: 'Python',
                    data: [
                        { x: 20, y: 82 },
                        { x: 22, y: 70 },
                        { x: 25, y: 68 },
                        { x: 23, y: 75 },
                        { x: 21, y: 80 },
                        { x: 19, y: 78 },
                        { x: 24, y: 72 },
                        { x: 26, y: 69 },
                        { x: 18, y: 76 },
                        { x: 20, y: 71 },
                        { x: 22, y: 73 },
                        { x: 25, y: 74 },
                        { x: 23, y: 77 },
                        { x: 21, y: 79 },
                        { x: 19, y: 81 }
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 5
                }
            ];
            break;
        case 'PHP':
            datasets = [
                {
                    label: 'PHP',
                    data: [
                        { x: 18, y: 70 },
                        { x: 20, y: 75 },
                        { x: 22, y: 80 },
                        { x: 24, y: 85 },
                        { x: 26, y: 90 },
                        { x: 19, y: 72 },
                        { x: 21, y: 76 },
                        { x: 23, y: 78 },
                        { x: 25, y: 82 },
                        { x: 20, y: 74 },
                        { x: 22, y: 77 },
                        { x: 24, y: 81 },
                        { x: 26, y: 83 },
                        { x: 18, y: 68 },
                        { x: 19, y: 71 }
                    ],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    pointRadius: 5
                }
            ];
            break;
        case 'HTML':
            datasets = [
                {
                    label: 'HTML5',
                    data: [
                        { x: 18, y: 70 },
                        { x: 20, y: 75 },
                        { x: 22, y: 80 },
                        { x: 24, y: 85 },
                        { x: 26, y: 90 },
                        { x: 19, y: 72 },
                        { x: 21, y: 76 },
                        { x: 23, y: 78 },
                        { x: 25, y: 82 },
                        { x: 20, y: 74 },
                        { x: 22, y: 77 },
                        { x: 24, y: 81 },
                        { x: 26, y: 83 },
                        { x: 18, y: 68 },
                        { x: 19, y: 71 }
                    ],
                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    pointRadius: 5
                }
            ];
            break;
        case 'allLessons':
        default:
            datasets = [
                {
                    label: 'JavaScript',
                    data: [
                        { x: 30, y: 78 },
                        { x: 25, y: 85 },
                        { x: 35, y: 90 },
                        { x: 31, y: 82 },
                        { x: 33, y: 88 },
                        { x: 28, y: 79 },
                        { x: 29, y: 84 },
                        { x: 34, y: 89 },
                        { x: 32, y: 86 },
                        { x: 27, y: 81 },
                        { x: 26, y: 80 },
                        { x: 36, y: 91 },
                        { x: 32, y: 87 },
                        { x: 31, y: 83 },
                        { x: 30, y: 77 }
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 5
                },
                {
                    label: 'Python',
                    data: [
                        { x: 20, y: 82 },
                        { x: 22, y: 70 },
                        { x: 25, y: 68 },
                        { x: 23, y: 75 },
                        { x: 21, y: 80 },
                        { x: 19, y: 78 },
                        { x: 24, y: 72 },
                        { x: 26, y: 69 },
                        { x: 18, y: 76 },
                        { x: 20, y: 71 },
                        { x: 22, y: 73 },
                        { x: 25, y: 74 },
                        { x: 23, y: 77 },
                        { x: 21, y: 79 },
                        { x: 19, y: 81 }
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 5
                },
                {
                    label: 'PHP',
                    data: [
                        { x: 18, y: 70 },
                        { x: 20, y: 75 },
                        { x: 22, y: 80 },
                        { x: 24, y: 85 },
                        { x: 26, y: 90 },
                        { x: 19, y: 72 },
                        { x: 21, y: 76 },
                        { x: 23, y: 78 },
                        { x: 25, y: 82 },
                        { x: 20, y: 74 },
                        { x: 22, y: 77 },
                        { x: 24, y: 81 },
                        { x: 26, y: 83 },
                        { x: 18, y: 68 },
                        { x: 19, y: 71 }
                    ],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    pointRadius: 5
                },
                {
                    label: 'HTML5',
                    data: [
                        { x: 18, y: 70 },
                        { x: 20, y: 75 },
                        { x: 22, y: 80 },
                        { x: 24, y: 85 },
                        { x: 26, y: 90 },
                        { x: 19, y: 72 },
                        { x: 21, y: 76 },
                        { x: 23, y: 78 },
                        { x: 25, y: 82 },
                        { x: 20, y: 74 },
                        { x: 22, y: 77 },
                        { x: 24, y: 81 },
                        { x: 26, y: 83 },
                        { x: 18, y: 68 },
                        { x: 19, y: 71 }
                    ],
                    backgroundColor: 'rgba(255, 206, 86, 0.6)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    pointRadius: 5
                }
            ];
            break;
    }
    return datasets;
}


document.getElementById('LessonSelector').addEventListener('change', function () {
    var selectedLesson = this.value; // รับค่าที่ถูกเลือกจาก dropdown
    updateScatterChart(selectedLesson); // เรียกฟังก์ชันเพื่ออัปเดตแผนภูมิ scatter
    console.log(selectedLesson);
});

const ctx5 = document.getElementById('myChart5').getContext('2d');
const myChart5 = new Chart(ctx5, {
    type: 'bar',
    data: {
        labels: ['JavaScript', 'Python', 'HTML5', 'PHP', 'C++'], // ป้ายของข้อมูล
        datasets: [{
            label: "แบบทดสอบ",
            data: [42, 71, 65, 91, 10], // ข้อมูลของแผนภูมิ
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 191)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'แบบทดสอบ', // ป้ายกำกับแกน X
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน X
                        family: 'Noto Sans Thai, sans-serif'
                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน X
                        family: 'Noto Sans Thai, sans-serif'

                    }
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'คะแนน', // ป้ายกำกับแกน Y
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน Y
                        family: 'Noto Sans Thai, sans-serif'

                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน Y
                        family: 'Noto Sans Thai, sans-serif'
                    }
                }
            }
        }
    },
    plugins: {
        legend: {
            labels: {
                font: {
                    family: 'Noto Sans Thai, sans-serif', // ฟอนต์ของป้ายกำกับใน legend
                    size: 14
                }
            }
        }
    }
});

const ctx6 = document.getElementById('myChart6').getContext('2d');
const myChart6 = new Chart(ctx6, {
    type: 'bar', // ประเภทของแผนภูมิ เช่น 'bar', 'line', 'pie', 'doughnut' ฯลฯ
    data: {
        labels: ['Python', 'Java', 'C++', 'Node.js', 'PHP', 'HTML5', 'Ruby', 'Go', 'Swift'], // ป้ายของข้อมูล
        datasets: [{
            label: 'งานที่มอบหมาย',
            data: [100, 20, 39, 79, 91, 50, 68, 73, 85], // ข้อมูลของแผนภูมิ
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
                'rgba(255, 205, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)'
            ],
            borderColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 191)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
                'rgba(255, 205, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'งานที่มอบหมาย', // ป้ายกำกับแกน X
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน X
                        family: 'Noto Sans Thai, sans-serif'
                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน X
                        family: 'Noto Sans Thai, sans-serif'
                    }
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'จำนวนการส่ง', // ป้ายกำกับแกน Y
                    font: {
                        size: 16, // ขนาดตัวหนังสือของป้ายกำกับแกน Y
                        family: 'Noto Sans Thai, sans-serif'
                    }
                },
                ticks: {
                    font: {
                        size: 14, // ขนาดตัวหนังสือของป้ายข้อมูลในแกน Y
                        family: 'Noto Sans Thai, sans-serif'
                    }
                }
            }
        }
    }
});

const ctx7 = document.getElementById('myChart7').getContext('2d');
const myChart7 = new Chart(ctx7, {
    type: 'pie', // ประเภทของแผนภูมิเปลี่ยนเป็น 'pie'
    data: {
        labels: ['Python', 'Java', 'C++', 'Node.js', 'PHP', 'HTML5', 'Ruby', 'Go', 'Swift'], // ป้ายของข้อมูล
        datasets: [{
            label: 'งานที่มอบหมาย',
            data: [12, 19, 3, 5, 2, 3, 7, 6, 8], // ข้อมูลของแผนภูมิ
            backgroundColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
                'rgba(255, 205, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)'
            ],
            borderColor: [
                'rgba(255, 99, 132)',
                'rgba(54, 162, 235)',
                'rgba(255, 206, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)',
                'rgba(255, 159, 64)',
                'rgba(255, 205, 86)',
                'rgba(75, 192, 192)',
                'rgba(153, 102, 255)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false, // ไม่รักษาอัตราส่วนเดิม
        plugins: {
            legend: {
                position: 'left', // เปลี่ยนตำแหน่งของ legend เป็นด้านซ้าย
                align: 'start', // ให้ label เรียงเป็น block ในแนวตั้ง
                labels: {
                    font: {
                        family: 'Noto Sans Thai, sans-serif'
                    },
                    boxWidth: 20, // กำหนดความกว้างของกล่องสีใน legend
                    padding: 15 // กำหนดระยะห่างระหว่างกล่องสีและข้อความ
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.label || '';
                        if (label) {
                            label += ': ';
                        }
                        let total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                        let percentage = ((context.raw / total) * 100).toFixed(2);
                        label += `${context.raw} (${percentage}%)`;
                        return label;
                    }
                }
            }
        }
    }
});
