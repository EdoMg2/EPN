const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'tu_secreto', // Cambia esto por una cadena secreta real
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Para desarrollo, en producción debería ser true
}));

app.use('/assets', express.static(path.join(__dirname, 'assets')));



const db = new sqlite3.Database('la_condesa.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos la_condesa.db.');
    }
});
const { exec } = require('child_process');

// Ruta para iniciar sesión como cliente
app.post('/login-cliente', (req, res) => {
    const { nombre } = req.body;

    if (!nombre) {
        res.status(400).send('El nombre es obligatorio');
        return;
    }

    db.get('SELECT ClienteID FROM Clientes WHERE Nombre = ?', [nombre], (err, row) => {
        if (err) {
            console.error('Error en la consulta', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }

        if (row) {
            console.log(`Cliente encontrado: ${nombre} con ClienteID: ${row.ClienteID}`);
            req.session.clienteID = row.ClienteID;
            res.json({ redirect: '/orden' });
        } else {
            console.log(`Insertando nuevo cliente: ${nombre}`);
            db.run('INSERT INTO Clientes (Nombre) VALUES (?)', [nombre], function(err) {
                if (err) {
                    console.error('Error al insertar cliente', err.message);
                    res.status(500).send('Error en el servidor');
                    return;
                }
                req.session.clienteID = this.lastID;
                console.log(`Nuevo cliente insertado con ClienteID: ${this.lastID}`);
                res.json({ redirect: '/orden' });
            });
        }
    });
});

// Ruta para iniciar sesión como empleado
app.post('/login-empleado', (req, res) => {
    const { idEmpleado, contrasenaEmpleado } = req.body;
    db.get("SELECT * FROM Empleados WHERE EmpleadoID = ? AND Contrasena = ?", [idEmpleado, contrasenaEmpleado], (err, row) => {
        if (err) {
            console.error('Error en SQL', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }
        if (row) {
            res.json({ redirect: '/dashboard' });
        } else {
            res.status(401).json({ error: "Credenciales de empleado incorrectas" });
        }
    });
});

app.post('/procesar-compra', (req, res) => {
    const { carrito, total } = req.body;
    console.log("Procesando compra:", carrito, "Total:", total);
    const clienteID = req.session.clienteID;

    if (!clienteID) {
        res.status(401).send('No se ha iniciado sesión');
        return;
    }

    Object.entries(carrito).forEach(([sabor, cantidad]) => {
        db.get('SELECT SaborID, Precio FROM Sabores WHERE Nombre = ?', [sabor], (err, row) => {
            if (err) {
                console.error('Error en la consulta', err.message);
                return;
            }
            if (row) {
                const saborID = row.SaborID;
                const precioTotal = row.Precio * cantidad;

                db.run('INSERT INTO Compras (ClienteID, SaborID, Cantidad, Precio) VALUES (?, ?, ?, ?)', [clienteID, saborID, cantidad, precioTotal], function(err) {
                    if (err) {
                        console.error('Error al insertar en Compras', err.message);
                        return;
                    }
                    console.log(`Compra realizada: ClienteID ${clienteID}, SaborID ${saborID}, Cantidad ${cantidad}, Precio Total ${precioTotal}`);
                });
            }
        });
    });
    
    res.send('Compra procesada');

    exec('python Icecream/robot.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar robot.py: ${error}`);
            return;
        }
        console.log(`Salida de robot.py: ${stdout}`);
        if (stderr) {
            console.error(`Error en robot.py: ${stderr}`);
        }
    });
});


// Ruta para obtener la lista de Clientes
app.get('/clientes', (req, res) => {
    db.all('SELECT * FROM Clientes', (err, rows) => {
        if (err) {
            console.error('Error en la consulta de Clientes', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }
        res.json({ clientes: rows });
    });
});

// Ruta para obtener la lista de Compras
app.get('/compras', (req, res) => {
    db.all('SELECT CompraID, Clientes.Nombre as Cliente, Sabores.Nombre as Sabor, Compras.Fecha, Cantidad, Compras.Precio FROM Compras ' +
           'INNER JOIN Clientes ON Compras.ClienteID = Clientes.ClienteID ' +
           'INNER JOIN Sabores ON Compras.SaborID = Sabores.SaborID', (err, rows) => {
        if (err) {
            console.error('Error en la consulta de Compras', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }
        res.json({ compras: rows });
    });
});


// Ruta para obtener la lista de Productos (Sabores)
app.get('/productos', (req, res) => {
    const query = `
        SELECT 
            Sabores.SaborID, 
            Sabores.Nombre, 
            Sabores.Descripcion, 
            Sabores.Precio, 
            IFNULL(SUM(Compras.Cantidad), 0) as Ventas 
        FROM Sabores
        LEFT JOIN Compras ON Sabores.SaborID = Compras.SaborID
        GROUP BY Sabores.SaborID
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error en la consulta de Sabores', err.message);
            res.status(500).send('Error en el servidor');
            return;
        }
        res.json({ productos: rows });
    });
});

app.post('/editarCliente/:clienteID', (req, res) => {
    const { clienteID } = req.params;
    const { email, telefono } = req.body;

    const query = `UPDATE Clientes SET Email = ?, Telefono = ? WHERE ClienteID = ?`;
    db.run(query, [email, telefono, clienteID], function(err) {
        if (err) {
            console.error('Error updating client', err.message);
            res.status(500).send('Error updating client');
            return;
        }
        res.send('Client updated successfully');
    });
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

app.get('/orden', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/orden.html'));
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});