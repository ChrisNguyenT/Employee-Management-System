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
            choices: ['View all employees', 'Add new employee', 'Remove current employee', 'Update employee information', 'MAIN MENU'],
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
                case 'Remove current employee':
                    deleteEmployee();
                    break;
                case 'Update employee information':
                    updateEmployee();
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

// Function to add employee information
function addEmployee(manager) {
    const query = 'SELECT * FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt([
            {
                type: 'input',
                message: `What is the employee's first name?`,
                name: 'first_name',
            },
            {
                type: 'input',
                message: `What is the employee's last name?`,
                name: 'last_name',
            },
            {
                type: 'list',
                message: `What is the employee's role?`,
                name: 'employee_role',
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
            {
                type: 'list',
                message: 'Please CONFIRM the information:',
                name: 'Confirmation',
                choices: ['CONFIRM', 'CANCEL'],
            },
            ])
            .then((response) => {
                if (response.Confirmation == 'CANCEL') {
                    console.log(`\n--New employee was not added to the database--\n\n`);
                    employees();
                } else {
                connection.query(`SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS name FROM employee`, (err, res) => {
                    if (err) throw err;
                    let managerID;
                    if (response.manager !== 'None') {
                        let manager_data = res.filter((id) => {
                            return response.manager == id.name
                        })
                        managerID = JSON.parse(JSON.stringify(manager_data))[0].id
                    } else {
                        managerID = null;
                    }
                    connection.query(`SELECT role.id, role.title FROM role`, (err, res) => {
                        if (err) throw err;
                        let roleInfo = res.filter((id) => {
                            return response.employee_role == id.title
                        });
                        let roleId = JSON.parse(JSON.stringify(roleInfo))[0].id
                        addData(roleId, response, managerID);
                    })
                });}
            })
    })
}

// Function to push new employee information
function addData(id, response, managerID) {
    connection.query('INSERT INTO employee SET?',
        {
            first_name: response.first_name,
            last_name: response.last_name,
            role_id: id,
            manager_id: managerID
        },
        (err) => {
            if (err) throw err;
            console.log(`\n---${response.first_name} ${response.last_name} has been added to your database!---\n\n`)
            employees();
        }
    )
}

// Function to delete an employee
function deleteEmployee() {
    const query = 'SELECT CONCAT(employee.first_name, " ", employee.last_name) as name FROM employee';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt({
                type: 'list',
                message: `Which employee would you like to remove from the database?`,
                name: 'employee_name',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ name }) => {
                        choiceList.push(name);
                    });
                    return choiceList
                },
            })
            .then((response) => {
                if (response.employee_name == 'CANCEL') {
                    employees();
                } else {
                    const query = `SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS name FROM employee`;
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        let current_employee = res.filter((employee) => {
                            return response.employee_name == employee.name;
                        })
                        let id = JSON.parse(JSON.stringify(current_employee))[0].id
                        deleteEmployeeById(id, response.employee_name);
                    });
                }
            })
    });
}

// Function to update the database with deleted employee
function deleteEmployeeById(id, employee) {
    const query = `DELETE FROM employee WHERE id=${id}`;
    connection.query(query, (err, res) => {
        if (err) throw err;
        console.log(`\n---You have removed ${employee} from the database---\n\n`);
        employees();
    });
}

// Function to update employee information
function updateEmployee() {
    const query = 'SELECT CONCAT(employee.first_name, " ", employee.last_name) as name FROM employee';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt({
                type: 'list',
                message: `Which employee would you like to update?`,
                name: 'employee_name',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ name }) => {
                        choiceList.push(name);
                    });
                    return choiceList;
                },
            })
            .then((response) => {
                if (response.employee_name == 'CANCEL') {
                    employees();
                } else {
                    const query = `SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS name FROM employee`;
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        let current_employee = res.filter((employee) => {
                            return response.employee_name == employee.name;
                        })
                        let id = JSON.parse(JSON.stringify(current_employee))[0].id
                        updateEmployeeData(id, response.employee_name);
                    });
                }
            })
    });
}

// Function to select which information to update for the specific employee
function updateEmployeeData(id, name) {
    inquirer
        .prompt({
            type: 'list',
            message: `What information would you like to update for ${name}?`,
            name: 'update',
            choices: [{
                name: 'First Name',
                value: 'first_name'
            },
            {
                name: 'Last Name',
                value: 'last_name'
            },
            {
                name: 'Role',
                value: 'title'
            },
            {
                name: 'Manager',
                value: 'manager'
            },
            {
                name: 'CANCEL',
                value: ''
            }],
        })
        .then((response) => {
            if (response.update == '') {
                updateEmployee();
            } else {
                if (response.update == 'first_name' || response.update == 'last_name') {
                    updateName(id, response);
                }
                if (response.update == 'title') {
                    updateRole(id, response);
                }
                if (response.update == 'manager') {
                    updateManager(id, response);
                }
            }
        })
}

// Function to update name
function updateName(id, res) {
    inquirer
        .prompt({
            type: 'input',
            message: 'Please enter the updated name. (Leave blank to go back)',
            name: 'name',
        })
        .then((response) => {
            if (response.name == '') {
                console.log(`\n--Update canceled--\n\n`);
                updateEmployee();
            } else {
                const query = `UPDATE employee SET ${res.update} = '${response.name}' WHERE id = ${id}`
                connection.query(query, (err, res) => {
                    if (err) throw err;
                    console.log(`\n---Employee name updated---\n\n`)
                    updateEmployeeData();
                })
            };
        })
}

// Function to update role
function updateRole(id, res) {
    const query = 'SELECT * FROM role'
    connection.query(query, (err, response) => {
        if (err) throw err;
        inquirer
            .prompt({
                type: 'list',
                message: 'Please enter the new role title.',
                name: 'title',
                choices() {
                    const choiceList = ['CANCEL'];
                    response.forEach(({ title, id }) => {
                        var title_object = {
                            name: title,
                            value: id,
                        }
                        choiceList.push(title_object);
                    });
                    return choiceList;
                },
            })
            .then((user_input) => {
                if (user_input.title == 'CANCEL') {
                    updateEmployeeData();
                } else {
                    const query = `UPDATE employee SET role_id = ${user_input.title} WHERE id = ${id}`
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        console.log(`\n---Employee role updated---\n\n`);
                        updateEmployee();
                    });
                }
            })
    })
}

// Function to update manager
function updateManager(id, res) {
    const query = `SELECT employee.id, CONCAT (employee.first_name, " ", employee.last_name) AS managerName FROM employee`
    connection.query(query, (err, response) => {
        if (err) throw err;
        inquirer
            .prompt([{
                type: 'list',
                message: `Please enter the new ${res.update}.`,
                name: 'managerName',
                choices() {
                    const choiceList = ['None'];
                    response.forEach(({ managerName, id }) => {
                        var choiceObject = {
                            name: managerName,
                            value: id,
                        }
                        choiceList.push(choiceObject);
                    });
                    return choiceList;
                },
            },])
            .then((response) => {
                if (response.managerName == 'None') {
                    const query = `UPDATE employee SET manager_id = NULL WHERE id = ${id}`
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        log(chalk.green('Success! Employee manager updated!'))
                        start();
                    });
                } else {
                    const query = `UPDATE employee SET manager_id = ${response.managerName} WHERE id = ${id}`
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        log(chalk.green('Success! Employee manager updated!'))
                        start();
                    });
                }
            })
    })
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
            .prompt({
                type: 'list',
                message: `Which department would you like to view?`,
                name: 'departmentName',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ department_name }) => {
                        choiceList.push(department_name);
                    });
                    return choiceList;
                },
            })
            .then((response) => {
                if (response.departmentName == 'CANCEL') {
                    departments();
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
        let current_table = res.filter((name) => {
            return response.departmentName == name.Department;
        })
        table(current_table);
        viewEmployeeDepartment();
    });
}

// Add department

// Delete department

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
                name: 'role_name',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ title }) => {
                        choiceList.push(title);
                    });
                    return choiceList;
                },
            },
            ])
            .then((response) => {
                if (response.role_name == 'CANCEL') {
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
        let current_table = res.filter((name) => {
            return response.role_name == name.Role;
        })
        table(current_table);
        viewEmployeeRole();
    });
}

// Add role

// Delete role

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









