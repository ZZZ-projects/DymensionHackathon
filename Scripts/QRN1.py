import qiskit
from qiskit import QuantumRegister, QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, SamplerOptions

def set_qubits(n: int):
    # Initialize quantum and classical registers
    qr = QuantumRegister(n)
    cr = qiskit.ClassicalRegister(n)
    # Create a quantum circuit
    circuit = QuantumCircuit(qr, cr)
    circuit.h(qr)  # Apply Hadamard gate to qubits
    circuit.measure(qr, cr)  # Measure qubits
    return circuit

token = "e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5"
service = QiskitRuntimeService(channel="ibm_quantum", token=token)
backend = service.backend('ibm_osaka')

circuit = set_qubits(1)  # Set up a circuit with 1 qubit

# Transpile the circuit for the backend to ensure compatibility
transpiled_circuit = transpile(circuit, backend)

# Initialize the Sampler with options
options = SamplerOptions(default_shots=1024)
sampler = SamplerV2(backend=backend, options=options)

# Execute the circuit
try:
    job = sampler.run(transpiled_circuit)
    result = job.result()
    print("Result of quantum job:", result)
except Exception as e:
    print("An error occurred during job execution:", str(e))
