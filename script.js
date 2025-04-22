const tarifas = {
    ordinaria_diurna: 6911,
    ordinaria_nocturna: 9330,
    extra_diurna: 8639,
    extra_nocturna: 12095,
    dominical: 12095,
    dominical_nocturna: 14514,
    extra_festiva_diurna: 13823,
    extra_festiva_nocturna: 17279
  };

  const tabla = document.querySelector("#tabla-turnos tbody");
  const totalSpan = document.getElementById("total");

  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  function guardarTurnos() {
    localStorage.setItem("turnos", JSON.stringify(turnos));
  }

  function calcularPago(turno) {
    const { fecha, inicio, fin, descanso } = turno;
    const fechaObj = new Date(fecha + 'T00:00:00');
    const inicioDate = new Date(`1970-01-01T${inicio}:00`);
    const finDate = new Date(`1970-01-01T${fin}:00`);
    if (finDate <= inicioDate) finDate.setDate(finDate.getDate() + 1);

    let horasTrabajadas = (finDate - inicioDate) / (1000 * 60 * 60);
    horasTrabajadas -= descanso / 60;

    if (horasTrabajadas <= 0) return { tipo: "inválido", horas: 0, pago: 0 };

    const dia = fechaObj.getDay();
    const horaInicio = inicioDate.getHours();
    const horaFin = finDate.getHours();
    const esDomingo = dia === 0;
    const esNocturno = horaInicio >= 21 || horaFin <= 6;
    const esExtra = horasTrabajadas > 8;

    let tipo = "ordinaria_diurna";
    if (esDomingo && esNocturno && esExtra) tipo = "extra_festiva_nocturna";
    else if (esDomingo && esNocturno) tipo = "dominical_nocturna";
    else if (esDomingo && esExtra) tipo = "extra_festiva_diurna";
    else if (esDomingo) tipo = "dominical";
    else if (esNocturno && esExtra) tipo = "extra_nocturna";
    else if (esNocturno) tipo = "ordinaria_nocturna";
    else if (esExtra) tipo = "extra_diurna";

    const pago = horasTrabajadas * tarifas[tipo];
    return { tipo, horas: horasTrabajadas, pago };
  }

  function actualizarTabla() {
    tabla.innerHTML = "";
    let total = 0;
    turnos.forEach((turno, index) => {
      const { tipo, horas, pago } = calcularPago(turno);
      total += pago;
      const fila = document.createElement("tr");
      const fechaMostrar = new Date(turno.fecha + 'T00:00:00').toLocaleDateString();
      fila.innerHTML = `
        <td>${fechaMostrar}</td>
        <td>${horas.toFixed(2)}</td>
        <td>${tipo.replace(/_/g, " ")}</td>
        <td>$${pago.toLocaleString()}</td>
        <td class="acciones"><button onclick="eliminarTurno(${index})">Borrar</button></td>
      `;
      tabla.appendChild(fila);
    });
    totalSpan.textContent = total.toLocaleString();
  }

  function eliminarTurno(index) {
    if (confirm("¿Estás seguro de que deseas eliminar este turno?")) {
      turnos.splice(index, 1);
      guardarTurnos();
      actualizarTabla();
    }
  }

  function reiniciarCalculadora() {
    if (confirm("¿Estás seguro de que quieres reiniciar todos los datos?")) {
      localStorage.removeItem("turnos");
      document.querySelector("#tabla-turnos tbody").innerHTML = "";
      document.getElementById("total").textContent = "0";
    }
  }
  

  document.getElementById("turno-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const fecha = document.getElementById("fecha").value;
    const inicio = document.getElementById("inicio").value;
    const fin = document.getElementById("fin").value;
    const descanso = parseInt(document.getElementById("break").value);

    if (inicio === fin) return alert("La hora de inicio y fin no pueden ser iguales.");

    const turno = { fecha, inicio, fin, descanso };
    const { horas } = calcularPago(turno);
    if (horas <= 0) return alert("Las horas trabajadas deben ser mayores que cero.");

    turnos.push(turno);
    guardarTurnos();
    actualizarTabla();
    this.reset();
  });

  // Inicializar tabla al cargar
  actualizarTabla();