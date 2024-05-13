import qiskit
from qiskit import QuantumRegister, QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, SamplerOptions

def set_qubits(n: int):
    qr = QuantumRegister(n)
    cr = qiskit.ClassicalRegister(n)
    circuit = QuantumCircuit(qr, cr)
    circuit.h(qr)  # Apply Hadamard gate to qubits
    circuit.measure(qr, cr)
    return circuit

# Token and service initialization
token = "e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5"
service = QiskitRuntimeService(channel="ibm_quantum", token=token)
backend = service.backend('ibm_sherbrooke')

# Create and set up the circuit
circuit = set_qubits(1)  # Adjust register size as needed

# Transpile circuit for the backend, specifying optimization and layout
transpiled_circuit = transpile(circuit, backend, optimization_level=2, initial_layout=[0])

# Print the transpiled circuit to check its structure
print("Transpiled Circuit:")
print(transpiled_circuit.draw())

# Sampler initialization with options
options = SamplerOptions(default_shots=1024)  # Example: setting default shots
sampler = SamplerV2(backend=backend, options=options)

# Run the circuit and handle errors
try:
    job = sampler.run(transpiled_circuit, shots=1024)  # Execute the circuit
    result = job.result()
    print("Quantum job result:", result)
except Exception as e:
    print("An error occurred during job execution:", str(e))
