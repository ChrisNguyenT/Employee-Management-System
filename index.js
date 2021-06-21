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
    console.log('\n\nEmployee Management System\n\n');

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
                    log('Goodbye');
                    connection.end();
                    break;
                default:
                    console.log('Error');
                    start();
                    break;
            }
        });
}

function employees(){
    return console.log('None');
}

