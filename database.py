import sqlite3

# Conectar a la base de datos (se crea si no existe)
conn = sqlite3.connect('la_condesa.db')

# Crear un cursor para ejecutar comandos SQL
cursor = conn.cursor()

# Eliminar tablas existentes si existen
cursor.execute('DROP TABLE IF EXISTS Clientes')
cursor.execute('DROP TABLE IF EXISTS Sabores')
cursor.execute('DROP TABLE IF EXISTS Compras')
cursor.execute('DROP TABLE IF EXISTS Proveedores')
cursor.execute('DROP TABLE IF EXISTS Empleados')

# Crear tabla de Clientes
cursor.execute('''
CREATE TABLE Clientes (
    ClienteID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Email TEXT UNIQUE,
    Telefono TEXT
)
''')

cursor.execute('''
CREATE TABLE IF NOT EXISTS Sabores (
    SaborID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Descripcion TEXT,
    Precio REAL NOT NULL
)
''')

# Insertar sabores iniciales
sabores_iniciales = [
    ('Oreo', 'Nieve sabor Oreo', 25.0),
    ('Fresa', 'Nieve sabor Fresa', 25.0),
    ('Chocolate', 'Nieve sabor Chocolate', 25.0),
    ('Vainilla', 'Nieve sabor Vainilla', 25.0),
    ('Menta', 'Nieve sabor Menta', 25.0),
    ('Chicle', 'Nieve sabor Chicle', 25.0)
]
cursor.executemany('INSERT INTO Sabores (Nombre, Descripcion, Precio) VALUES (?, ?, ?)', sabores_iniciales)

# Crear tabla de Compras
cursor.execute('''
CREATE TABLE Compras (
    CompraID INTEGER PRIMARY KEY AUTOINCREMENT,
    ClienteID INTEGER,
    SaborID INTEGER,
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Cantidad INTEGER,
    Precio REAL,
    FOREIGN KEY (ClienteID) REFERENCES Clientes (ClienteID),
    FOREIGN KEY (SaborID) REFERENCES Sabores (SaborID)
)
''')

# Crear tabla de Proveedores
cursor.execute('''
CREATE TABLE Proveedores (
    ProveedorID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Contacto TEXT,
    Telefono TEXT
)
''')

# Crear tabla de Empleados
cursor.execute('''
CREATE TABLE Empleados (
    EmpleadoID TEXT PRIMARY KEY,
    Contrasena TEXT NOT NULL
)
''')

# Insertar usuario administrador
cursor.execute('''
INSERT INTO Empleados (EmpleadoID, Contrasena) VALUES (?, ?)
''', ('admin', 'admin'))

# Guardar los cambios y cerrar la conexión a la base de datos
conn.commit()
conn.close()
