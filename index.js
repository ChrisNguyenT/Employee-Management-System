// Declare dependencies
const inquirer = require('inquirer');
const mysql = require('mysql');
const { printTable } = require('console-table-printer');
const env = require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: process.env.password,
    database: 'employee_DB',
});

connection.connect((err) => {
    if (err) throw err;
});

// Start function
start();

// TITLE
function start() {
    console.log('\n\n--------EMPLOYEE MANAGEMENT SYSTEM--------\n\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'MAIN MENU: What would you like to access?',
            choices: ['Employees', 'Departments', 'Roles', 'EXIT'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'Employees':
                    employees();
                    break;
                case 'Departments':
                    departments();
                    break;
                case 'Roles':
                    roles();
                    break;
                case 'EXIT':
                    console.log('\nGoodbye\n\n');
                    connection.end();
                    break;
            }
        });
}

// EMPLOYEE MANAGEMENT
function employees() {
    console.log('\n\n--------Employee Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all employees', 'Add new employee', 'Delete current employee', 'Change employee roles', 'MAIN MENU'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all employees':
                    viewEmployees();
                    break;
                case 'Add new employee':
                    newEmployee();
                    break;
                case 'Delete current employee':
                    deleteEmployee();
                    break;
                case 'Change employee roles':
                    changeEmployee();
                    break;
                case 'MAIN MENU':
                    start();
                    break;
            }
        });
}

// Function to view all employees
function viewEmployees() {
    const query = 'SELECT employee.id, employee.first_name AS "First Name", employee.last_name AS "Last Name", role.title AS Role, role.salary AS Salary, department.department_name AS Department, CONCAT(manager.first_name, " ", manager.last_name) AS Manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee manager ON manager.id = employee.manager_id';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        employees();
    });
}

// Function to add a new employee
function newEmployee() {
    const query = 'SELECT CONCAT (employee.first_name, " ", employee.last_name) AS name FROM employee'

    connection.query(query, (err, res) => {
        if (err) throw err;

        addEmployee(res)
    })
}

function addEmployee(manager) {
    const query = 'SELECT * FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;

        inquirer
            .prompt([{
                type: 'input',
                message: `What is the employee's first name?`,
                name: 'employeeFirstName',
            },
            {
                type: 'input',
                message: `What is the employee's last name?`,
                name: 'employeeLastName',
            },
            {
                type: 'list',
                message: `What is the employee's role?`,
                name: 'employeeRole',
                choices() {
                    const choiceList = [];
                    res.forEach(({ title }) => {
                        choiceList.push(title);
                    });
                    return choiceList;
                },
            },
            {
                type: 'list',
                message: `Who is the manager?`,
                name: 'manager',
                choices() {
                    const choiceList = ['None'];
                    manager.forEach(({ name }) => {
                        choiceList.push(name);
                    });
                    return choiceList;
                },
            },
            ])
            .then((response) => {
                connection.query(`SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS name FROM employee`, (err, res) => {
                    if (err) throw err;

                    let managerId;

                    if (response.manager !== 'None') {
                        let managerInfo = res.filter((id) => {
                            return response.manager == id.name
                        })

                        managerId = JSON.parse(JSON.stringify(managerInfo))[0].id
                    } else {
                        managerId = null;
                    }

                    connection.query(`SELECT role.id, role.title FROM role`, (err, res) => {
                        if (err) throw err;

                        let roleInfo = res.filter((id) => {
                            return response.employeeRole == id.title
                        });
                        let roleId = JSON.parse(JSON.stringify(roleInfo))[0].id
                        addData(roleId, response, managerId);
                    })

                })
            })
    })
}

function addData(id, response, managerId) {
    connection.query('INSERT INTO employee SET?',
        {
            first_name: response.employeeFirstName,
            last_name: response.employeeLastName,
            role_id: id,
            manager_id: managerId
        },
        (err) => {
            if (err) throw err;
            console.log(`\n---${response.employeeFirstName} ${response.employeeLastName} has been added to your database!---`)
            employees();
        }
    )
}

// DEPARTMENT MANAGEMENT
function departments() {
    console.log('\n\n--------Department Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all departments', 'View employees by department', 'Add Department', 'Delete Department', 'MAIN MENU'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all departments':
                    viewDepartments();
                    break;
                case 'View employees by department':
                    viewEmployeeDepartment();
                    break;
                case 'Add Department':
                    addDepartment();
                    break;
                case 'Delete Department':
                    deleteDepartment();
                    break;
                case 'MAIN MENU':
                    start();
                    break;
            }
        });
}

// View all departments
function viewDepartments() {
    const query = 'SELECT department.id, department.department_name AS Name FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        departments();
    });
}

// View employees by department
function viewEmployeeDepartment() {
    const query = 'SELECT * FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;

        inquirer
            .prompt([{
                type: 'list',
                message: `Which department would you like to view?`,
                name: 'departmentName',
                choices() {
                    const choiceList = ['Cancel'];
                    res.forEach(({ department_name }) => {
                        choiceList.push(department_name);
                    });
                    return choiceList;
                },
            },
            ])
            .then((response) => {
                if (response.departmentName == 'Cancel') {
                    start();
                } else {
                    viewEmployeeByDepartment(response);
                }
            })
    });
}

function viewEmployeeByDepartment(response) {
    const query = 'SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS Name, role.title AS Role, department.department_name AS Department, role.salary AS Salary FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id';
    connection.query(query, (err, res) => {
        if (err) throw err;
        let updatedTable = res.filter((name) => {
            return response.departmentName == name.Department;
        })
        table(updatedTable);
        departments();
    });
}

// ROLES MANAGEMENT
function roles() {
    console.log('\n\n--------Roles Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all roles', 'View employees by role', 'Add role', 'Delete role', 'MAIN MENU'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all roles':
                    viewRoles();
                    break;
                case 'View employees by role':
                    viewEmployeeRole();
                    break;
                case 'Add role':
                    addRole();
                    break;
                case 'Delete role':
                    deleteRole();
                    break;
                case 'MAIN MENU':
                    start();
                    break;
            }
        });
}

// View all roles
function viewRoles() {
    const query = 'SELECT role.id, role.title AS Title, role.salary AS Salary FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        roles();
    });
}

// View employees by role
function viewEmployeeRole() {
    const query = 'SELECT * FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;

        inquirer
            .prompt([{
                type: 'list',
                message: `Which role would you like to view?`,
                name: 'roleName',
                choices() {
                    const choiceList = ['Cancel'];
                    res.forEach(({ title }) => {
                        choiceList.push(title);
                    });
                    return choiceList;
                },
            },
            ])
            .then((response) => {
                if (response.roleName == 'Cancel') {
                    roles();
                } else {
                    viewEmployeeByRole(response);
                }
            })
    });
}

function viewEmployeeByRole(response) {
    const query = 'SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS Name, role.title AS Role, department.department_name AS Department, role.salary AS Salary FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id';
    connection.query(query, (err, res) => {
        if (err) throw err;
        let updatedTable = res.filter((name) => {
            return response.roleName == name.Role;
        })
        table(updatedTable);
        roles();
    });
}


// 
// 
// Function to print tables to console
function table(values) {
    if (values.length !== 0) {
        printTable(values);
    } else {
        console.log('No available data.');
    };
}









