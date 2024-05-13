import qiskit
from qiskit import QuantumRegister, QuantumCircuit 
from qiskit_ibm_runtime import QiskitRuntimeService, Sampler

def set_qubits(n: int):
    global circuit
    qr = QuantumRegister(n) # Create a quantum register of size n
    cr = qiskit.ClassicalRegister(n)
    circuit = QuantumCircuit(qr, cr)
    circuit.h(qr) # Apply Hadamard gate to qubits
    circuit.measure(qr, cr)


service = QiskitRuntimeService(channel="ibm_quantum", token="e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5") # Add API token here
backend = service.backend('ibm_osaka')
set_qubits(1) # Adjust register size as needed
job = Sampler(backend).run(circuit)
result = job.result()
print(result) # Prints quantum random number