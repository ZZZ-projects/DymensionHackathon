import qiskit
from qiskit import QuantumRegister, QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, SamplerOptions
from math import pi

token = "e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5"
service = QiskitRuntimeService(channel="ibm_quantum", token=token)
backend = service.backend('ibm_osaka')

def set_qubits(n: int):
    qr = QuantumRegister(n)
    cr = qiskit.ClassicalRegister(n)
    circuit = QuantumCircuit(qr, cr)
    circuit.rz(pi/2, qr)  # Apply Rz gate explicitly
    circuit.h(qr)  # Apply Hadamard gate
    circuit.measure(qr, cr)
    return circuit

circuit = set_qubits(1)  # Setup for one qubit
transpiled_circuit = transpile(circuit, backend)
print("Transpiled Circuit:")
print(transpiled_circuit)

options = SamplerOptions(default_shots=1024)
sampler = SamplerV2(backend=backend, options=options)

try:
    job = sampler.run(transpiled_circuit)
    result = job.result()
    print("Quantum job result:", result)
except Exception as e:
    print("An error occurred during job execution:", str(e))
