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

start();

// Title screen
function start() {
    console.log('\n\n--------Employee Management System--------\n\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to access?',
            choices: ['Employees', 'Departments', 'Roles', 'Exit'],
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
                case 'Exit':
                    console.log('\nGoodbye\n\n');
                    connection.end();
                    break;
            }
        });
}

// Employee Management
function employees() {
    console.log('\n\n--------Employee Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all employees', 'Add new employee', 'Delete current employee', 'Change employee roles', 'Exit'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all employees':
                    viewEmployees();
                    break;
                case 'Add new employee':
                    addEmployee();
                    break;
                case 'Delete current employee':
                    deleteEmployee();
                    break;
                case 'Change employee roles':
                    changeEmployee();
                    break;
                case 'Exit':
                    start();
                    break;
            }
        });
}

// Department Management
function departments() {
    console.log('\n\n--------Department Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all departments', 'Add', 'Delete', 'Exit'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all departments':
                    viewDepartments();
                    break;
                case 'Add':
                    addDepartment();
                    break;
                case 'Delete':
                    deleteDepartment();
                    break;
                case 'Exit':
                    start();
                    break;
            }
        });
}

// Roles Management
function roles() {
    console.log('\n\n--------Roles Menu--------\n');

    inquirer
        .prompt({
            name: 'option',
            type: 'list',
            message: 'What would you like to do?',
            choices: ['View all roles', 'Add role', 'Delete role', 'Exit'],
        })
        .then((response) => {
            // Options
            switch (response.option) {
                case 'View all roles':
                    viewRoles();
                    break;
                case 'Add role':
                    addRole();
                    break;
                case 'Delete role':
                    deleteRole();
                    break;
                case 'Exit':
                    start();
                    break;
            }
        });
}

function table(values) {
    if (values.length !== 0) {
        printTable(values);
    } else {
        console.log('No available data.');
    };
}

function viewEmployees() {
    const query = 'SELECT employee.id, employee.first_name, employee.last_name, employee.role_id FROM employee';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        employees();
    });
}

function viewDepartments() {
    const query = 'SELECT department.id, department.department_name FROM department';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        departments();
    });
}

function viewRoles() {
    const query = 'SELECT role.id, role.title, role.salary FROM role';
    connection.query(query, (err, res) => {
        if (err) throw err;
        table(res);
        roles();
    });
}