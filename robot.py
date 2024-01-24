import socket

def main():
    host = '10.13.1.16'  # La dirección IP del servidor
    port = 6000        # El mismo puerto que el del servidor

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((host, port))
        # Enviar el comando para ejecutar el script de AutoIt
        s.sendall(b'run_autoit_script')
        # Recibir confirmación del servidor
        data = s.recv(1024)
        print(f"Recibido del servidor: {data.decode('utf-8')}")


main()

