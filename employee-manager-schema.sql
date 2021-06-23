DROP DATABASE IF EXISTS employee_DB;
CREATE database employee_DB;

USE employee_DB;

CREATE TABLE department (
    id INT AUTO_INCREMENT NOT NULL,
    department_name VARCHAR(30) NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO `department` VALUES (1,'Human Resources'),(2,'Service'),(3,'Accounting'),(4,'Sales'),(5,'IT');

CREATE TABLE role (
    id INT AUTO_INCREMENT NOT NULL,
    title VARCHAR(30) NOT NULL,
    salary DECIMAL(10, 0) NOT NULL,
    department_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY (department_id) REFERENCES department(id)
);

INSERT INTO `role` VALUES (1,'Manager',80000.00,1),(2,'Assistant Manager',65000.00,1),(3,'HR Representative',50000.00,1),(4,'Intern',20000.00,3),(5,'Sales Representative',55000.00,4),(6,'Technician',65000.00,5);

CREATE TABLE employee (
    id INT AUTO_INCREMENT NOT NULL,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT,
    manager_id INT,
    PRIMARY KEY (id),
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (manager_id) REFERENCES role(id)
);

INSERT INTO `employee` VALUES (1,'John','Doe',1,2),(2,'Elliot','Jones',2,2),(3,'Jaden','Smith',2,3),(4,'Harry','Styles',3,4),(5,'Steve','Wu',5,3),(6,'Brando','Lam',4,2),(7,'Thomas','Bro',6,3),(8,'Kimm','Possible',4,1),(9,'Jessica','Jones',5,2),(10,'Ariana','Venti',4,1);