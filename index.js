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
                            let roleID = JSON.parse(JSON.stringify(roleInfo))[0].id
                            addData(roleID, response, managerID);
                        })
                    });
                }
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
                        removeEmployee(id, response.employee_name);
                    });
                }
            })
    });
}

// Function to update the database with deleted employee
function removeEmployee(id, employee) {
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
                    updateEmployee();
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
                message: 'Please select the new role title.',
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
            .then((response) => {
                if (response == 'CANCEL') {
                    updateEmployeeData();
                } else {
                    const query = `UPDATE employee SET role_id = ${response.title} WHERE id = ${id}`
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
                message: 'Please select the new manager.',
                name: 'managerName',
                choices() {
                    const choiceList = ['None'];
                    response.forEach(({ managerName, id }) => {
                        var manager_object = {
                            name: managerName,
                            value: id,
                        }
                        choiceList.push(manager_object);
                    });
                    return choiceList;
                },
            },])
            .then((response) => {
                if (response.managerName == 'None') {
                    const query = `UPDATE employee SET manager_id = NULL WHERE id = ${id}`
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        console.log(`\n---Employee's manager is updated---\n\n`);
                        updateEmployee();
                    });
                } else {
                    const query = `UPDATE employee SET manager_id = ${response.managerName} WHERE id = ${id}`
                    connection.query(query, (err, res) => {
                        if (err) throw err;
                        console.log(`\n---Employee's manager is updated---\n\n`)
                        updateEmployee();
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

// Function to add department
function addDepartment() {
    inquirer
        .prompt(
            {
                type: 'input',
                message: `What is the new department's name? (Leave blank to cancel)`,
                name: 'department',
            },
        )
        .then((response) => {
            if (response.department == '') {
                console.log(`\n--No department was added--\n\n`);
                departments();
            } else {
                connection.query(`INSERT INTO department SET?`,
                    {
                        department_name: response.department
                    },
                    (err) => {
                        if (err) throw err;
                        console.log(`\n---'${response.department}' department has been added to your database---\n\n`);
                        departments();
                    }
                )
            }
        })
}

// Function to delete departments
function deleteDepartment() {
    const query = 'SELECT * FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt({
                type: 'list',
                message: 'Which department would you like to remove from the database?',
                name: 'department',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ department_name }) => {
                        choiceList.push(department_name);
                    });
                    return choiceList;
                },
            })
            .then((response) => {
                const query = `SELECT department.id, department.department_name FROM department`;
                connection.query(query, (err, res) => {
                    if (err) throw err;
                    if (response.department == 'CANCEL') {
                        departments();
                    } else {
                        let departmentID = res.filter((role) => {
                            return response.department == role.department_name;
                        })
                        let id = JSON.parse(JSON.stringify(departmentID))[0].id
                        removeDepartment(id, response);
                    }
                });
            })
    });
}

// Function to update the database after deleting the database
function removeDepartment(departmentID, response) {
    const query = 'SELECT employee.id, employee.role_id, role.department_id FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id';
    connection.query(query, (err, res) => {
        let id;
        if (err) throw err;
        let employeeRoleID = res.filter((id) => {
            return departmentID == id.department_id;
        })
        if (employeeRoleID[0] == null) {
            id = 0;
        } else {
            id = JSON.parse(JSON.stringify(employeeRoleID))[0].department_id;
        }
        if (id == departmentID) {
            console.log(`\n---'${response.department}' department cannot be deleted because there are employee(s) assigned to it. Please update the employee's roles first---\n\n`);
            deleteDepartment();
        } else {
            const query = `DELETE FROM department WHERE id=${departmentID}`;
            connection.query(query, (err, res) => {
                if (err) throw err;
                console.log(`\n---'${response.department}' department has been removed from the database---\n\n`);
                departments();
            });
        }
    })
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

// Function to input new role information
function addRole() {
    const query = 'SELECT * FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    type: 'input',
                    message: `What is the title of the new role?`,
                    name: 'newRole',
                },
                {
                    type: 'input',
                    message: `What is the new role's salary?`,
                    name: 'salary',
                },
                {
                    type: 'list',
                    message: `Which department is this role under?`,
                    name: 'department',
                    choices() {
                        const choiceList = [];
                        res.forEach(({ department_name }) => {
                            choiceList.push(department_name);
                        });
                        return choiceList;
                    },
                },
                {
                    type: 'list',
                    message: 'Please CONFIRM the information:',
                    name: 'Confirmation',
                    choices: ['CONFIRM', 'CANCEL'],
                }])
            .then((response) => {
                if (response.Confirmation == 'CANCEL') {
                    console.log(`\n--New role was not added to the database--\n\n`);
                    roles();
                } else {
                    connection.query(`SELECT department.id, department.department_name FROM department`, (err, res) => {
                        if (err) throw err;
                        let departmentData = res.filter((id) => {
                            return response.department == id.department_name
                        });
                        let departmentID = JSON.parse(JSON.stringify(departmentData))[0].id;
                        updateNewRole(departmentID, response);
                    })
                }
            })
    })
}

// Function to update database with new role
function updateNewRole(id, response) {
    connection.query(`INSERT INTO role SET?`,
        {
            title: response.newRole,
            salary: response.salary,
            department_id: id,
        },
        (err) => {
            if (err) throw err;
            console.log(`\n---'${response.newRole}' role has been added to your database---\n\n`);
            roles();
        }
    )
}

// Function to delete roles
function deleteRole() {
    const query = 'SELECT * FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;
        inquirer
            .prompt({
                type: 'list',
                message: 'Which role would you like to remove from the database?',
                name: 'roleName',
                choices() {
                    const choiceList = ['CANCEL'];
                    res.forEach(({ title }) => {
                        choiceList.push(title);
                    });
                    return choiceList;
                },
            })
            .then((response) => {
                const query = 'SELECT role.id, role.title FROM role';
                connection.query(query, (err, res) => {
                    if (err) throw err;
                    if (response.roleName == 'CANCEL') {
                        roles();
                    } else {
                        let roleID = res.filter((role) => {
                            return response.roleName == role.title;
                        })
                        let id = JSON.parse(JSON.stringify(roleID))[0].id
                        removeRole(id, response);
                    }
                });
            })
    });
}

// Function to update database with deleted role
function removeRole(roleID, response) {
    const query = 'SELECT employee.id, employee.role_id FROM employee';
    connection.query(query, (err, res) => {
        let id;
        if (err) throw err;
        let employeeRoleId = res.filter((id) => {
            return roleID == id.role_id;
        })
        if (employeeRoleId[0] == null) {
            id = 0;
        } else {
            id = JSON.parse(JSON.stringify(employeeRoleId))[0].role_id;
        }
        if (id == roleID) {
            console.log(`\n--'${response.roleName}' role cannot be deleted because there are employee(s) assigned to it. Please update the employee's roles first--\n\n`);
            deleteRole();
        } else {
            const query = `DELETE FROM role WHERE id=${roleID}`;
            connection.query(query, (err, res) => {
                if (err) throw err;
                console.log(`'\n---'${response.roleName}' role has been removed from the database---\n\n`);
                roles();
            });
        }
    })
}

// 
// Function to print tables to console
function table(values) {
    if (values.length !== 0) {
        printTable(values);
    } else {
        console.log(`\n--No available data--\n\n`);
    };
}









