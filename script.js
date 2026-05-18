    // Массив приоритетов для сопоставления цветов
    const prioColors = {
        low: 'var(--prio-low)',
        medium: 'var(--prio-medium)',
        high: 'var(--prio-high)',
        urgent: 'var(--prio-urgent)'
    };
    // Базовые данные
    let tasks = JSON.parse(localStorage.getItem('monthTasks')) || [
        { id: 1, title: 'Разработка интерфейса', start: 1, end: 10, priority: 'high', completed: true },
        { id: 2, title: 'Интеграция скриптов', start: 8, end: 20, priority: 'medium', completed: false },
        { id: 3, title: 'Тестирование проекта', start: 18, end: 28, priority: 'urgent', completed: false }
    ];

    let isEditing = false;

    const taskForm = document.getElementById('taskForm');
    const taskList = document.getElementById('taskList');
    const ganttHeader = document.getElementById('ganttHeader');
    const ganttRows = document.getElementById('ganttRows');
    let currentSlide = 0;

    function saveToStorage() {
        localStorage.setItem('monthTasks', JSON.stringify(tasks));
    }

    function initGanttHeader() {
        ganttHeader.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            const day = document.createElement('div');
            day.innerText = i;
            ganttHeader.appendChild(day);
        }
    }

    // Основной рендеринг интерфейса
    function render() {
        taskList.innerHTML = '';
        ganttRows.innerHTML = '';

        tasks.forEach(task => {
            const color = prioColors[task.priority] || 'var(--primary)';

            // 1. Рендер элементов списка задач
            const li = document.createElement('li');
            li.className = 'task-item';
            li.innerHTML = `
                <div class="task-info ${task.completed ? 'completed' : ''}">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
                    <div class="prio-badge" style="background-color: ${color}"></div>
                    <span>${task.title}</span>
                    <span class="task-date">дни: ${task.start}-${task.end}</span>
                </div>
                <div class="action-btns">
                    <button class="edit-btn" onclick="startEditTask(${task.id})">✏️</button>
                    <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
                </div>
            `;
            taskList.appendChild(li);

            // 2. Рендер строк диаграммы Ганта
            const row = document.createElement('div');
            row.className = 'gantt-row';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'gantt-task-name';
            nameDiv.innerText = task.title;
            nameDiv.title = task.title;

            const timelineDiv = document.createElement('div');
            timelineDiv.className = 'gantt-timeline';

            const bar = document.createElement('div');
            bar.className = `gantt-bar ${task.completed ? 'completed' : ''}`;
            bar.style.backgroundColor = color;
            bar.style.gridColumnStart = task.start;
            bar.style.gridColumnEnd = task.end + 1;

            timelineDiv.appendChild(bar);
            row.appendChild(nameDiv);
            row.appendChild(timelineDiv);
            ganttRows.appendChild(row);
        });
        updateReports();
        saveToStorage();
    }

    // Обработка отправки формы (Создание или Редактирование)
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('editTaskId').value;
        const title = document.getElementById('taskTitle').value;
        const start = parseInt(document.getElementById('startDay').value);
        const end = parseInt(document.getElementById('endDay').value);
        const priority = document.getElementById('taskPriority').value;

        if (start > end) {
            alert('День начала не может быть позже дня окончания!');
            return;
        }

        if (isEditing) {
            // Обновление существующей задачи
            tasks = tasks.map(task => task.id == id ? { ...task, title, start, end, priority } : task);
            resetForm();
        } else {
            // Создание новой задачи
            tasks.push({
                id: Date.now(),
                title,
                start,
                end,
                priority,
                completed: false
            });
            taskForm.reset();
        }
        
        render();
    });

    // Режим редактирования: заполнение формы данными
    window.startEditTask = function(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        isEditing = true;
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('startDay').value = task.start;
        document.getElementById('endDay').value = task.end;
        document.getElementById('taskPriority').value = task.priority;

        document.getElementById('formTitle').innerText = '✏️ Редактировать задачу';
        document.getElementById('submitBtn').innerText = 'Сохранить';
        document.getElementById('cancelEditBtn').style.display = 'inline-block';
        
        document.getElementById('taskTitle').focus();
    }

    // Сброс формы в стандартный режим создания
    window.resetForm = function() {
        isEditing = false;
        taskForm.reset();
        document.getElementById('editTaskId').value = '';
        document.getElementById('formTitle').innerText = '➕ Добавить новую задачу';
        document.getElementById('submitBtn').innerText = 'Добавить';
        document.getElementById('cancelEditBtn').style.display = 'none';
    }

    window.toggleTask = function(id) {
        tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
        render();
    }

    window.deleteTask = function(id) {
        tasks = tasks.filter(task => task.id !== id);
        if (isEditing && document.getElementById('editTaskId').value == id) {
            resetForm();
        }
        render();
    }

    function updateReports() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const circle = document.getElementById('totalProgressCircle');
        circle.innerText = `${percent}%`;
        circle.style.background = `conic-gradient(var(--success) ${percent}%, var(--border) ${percent}%)`;
        document.getElementById('totalStatsText').innerText = `${completed} из ${total} задач выполнено`;

        const firstHalf = tasks.filter(t => t.start <= 15).length;
        const secondHalf = tasks.filter(t => t.start > 15).length;
        document.getElementById('firstHalfText').innerText = `${firstHalf} задач начато`;
        document.getElementById('secondHalfText').innerText = `${secondHalf} задач начато`;
    }

    window.changeSlide = function(direction) {
        const slides = document.querySelectorAll('.slide');
        slides[currentSlide].classList.remove('active');
        
        currentSlide += direction;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        slides[currentSlide].classList.add('active');
    }

    initGanttHeader();
    render();
