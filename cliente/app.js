
/*
Nombre: Juan Aquino, Lautaro Gonzalez y Luciano Farulla
Curso: 7°3
Trabajo: Consumo de API REST con JavaScript
*/

const API_URL = "http://localhost:8080/api/students";

// Elementos del HTML
const formulario = document.getElementById("formEstudiante");
const tabla = document.getElementById("tablaEstudiantes");
const mensaje = document.getElementById("mensaje");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");

let estudianteEditando = null;

// Mostrar mensajes en pantalla
function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = tipo;
}

// Limpiar formulario
function limpiarFormulario() {
    formulario.reset();
    estudianteEditando = null;
    btnGuardar.textContent = "Guardar";
}

// Mostrar estudiantes (GET)
async function cargarEstudiantes() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Error " + response.status);
        }

        const estudiantes = await response.json();

        tabla.innerHTML = "";

        if (estudiantes.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = 6;
            celda.textContent = "No hay estudiantes registrados";

            fila.appendChild(celda);
            tabla.appendChild(fila);
            return;
        }

        estudiantes.forEach(estudiante => {
            const fila = document.createElement("tr");

            const datos = [
                estudiante.id,
                estudiante.firstName,
                estudiante.lastName,
                estudiante.email,
                estudiante.age
            ];

            datos.forEach(dato => {
                const celda = document.createElement("td");
                celda.textContent = dato;
                fila.appendChild(celda);
            });

            const celdaAcciones = document.createElement("td");

            const btnEditar = document.createElement("button");
            btnEditar.textContent = "Editar";
            btnEditar.className = "btn-editar";
            btnEditar.addEventListener("click", () => {
                editarEstudiante(estudiante.id);
            });

            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.className = "btn-eliminar";
            btnEliminar.addEventListener("click", () => {
                eliminarEstudiante(estudiante.id);
            });

            celdaAcciones.appendChild(btnEditar);
            celdaAcciones.appendChild(btnEliminar);

            fila.appendChild(celdaAcciones);
            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error(error);

        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", "error");
        } else {
            mostrarMensaje("Error al cargar estudiantes: " + error.message, "error");
        }
    }
}

// Crear o actualizar estudiante (POST / PUT)
formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const estudiante = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        age: Number(document.getElementById("age").value)
    };

    const editando = estudianteEditando !== null;

    const url = editando
        ? `${API_URL}/${estudianteEditando}`
        : API_URL;

    const metodo = editando ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(estudiante)
        });

        if (!response.ok) {
            let errorData = {};

            try {
                errorData = await response.json();
            } catch {
                // La respuesta no contiene JSON
            }

            if (response.status === 400) {
                const errores = errorData.errors
                    ? Object.values(errorData.errors).join(", ")
                    : errorData.message || "Datos inválidos";

                mostrarMensaje(errores, "error");
                return;
            }

            if (response.status === 404) {
                mostrarMensaje("El estudiante no existe", "error");
                return;
            }

            throw new Error("Error " + response.status);
        }

        mostrarMensaje(
            editando
                ? "Estudiante actualizado correctamente"
                : "Estudiante creado correctamente",
            "exito"
        );

        limpiarFormulario();
        await cargarEstudiantes();

    } catch (error) {
        console.error(error);

        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", "error");
        } else {
            mostrarMensaje("Error al guardar: " + error.message, "error");
        }
    }
});

// Editar estudiante (GET por ID)
async function editarEstudiante(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);

        if (!response.ok) {
            if (response.status === 404) {
                await cargarEstudiantes();
                throw new Error("El estudiante no existe");
            }

            throw new Error("Error " + response.status);
        }

        const estudiante = await response.json();

        document.getElementById("firstName").value = estudiante.firstName;
        document.getElementById("lastName").value = estudiante.lastName;
        document.getElementById("email").value = estudiante.email;
        document.getElementById("age").value = estudiante.age;

        estudianteEditando = id;
        btnGuardar.textContent = "Actualizar";

        mostrarMensaje("Modificando estudiante ID: " + id, "exito");

        formulario.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        console.error(error);

        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", "error");
        } else {
            mostrarMensaje(error.message, "error");
        }
    }
}

// Cancelar edición
btnCancelar.addEventListener("click", function() {
    limpiarFormulario();
    mostrarMensaje("Operación cancelada", "exito");
});

// Eliminar estudiante (DELETE)
async function eliminarEstudiante(id) {
    const confirmar = confirm(
        "¿Estás seguro de que deseas eliminar este estudiante?"
    );

    if (!confirmar) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (response.status === 404) {
            await cargarEstudiantes();
            mostrarMensaje("El estudiante no existe", "error");
            return;
        }

        if (response.status !== 204) {
            throw new Error("Error " + response.status);
        }

        mostrarMensaje("Estudiante eliminado correctamente", "exito");

        if (estudianteEditando === id) {
            limpiarFormulario();
        }

        await cargarEstudiantes();

    } catch (error) {
        console.error(error);

        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", "error");
        } else {
            mostrarMensaje(error.message, "error");
        }
    }
}

// Cargar estudiantes al abrir la página
cargarEstudiantes();
