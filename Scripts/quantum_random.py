import qiskit
from qiskit import QuantumRegister, QuantumCircuit, transpile
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, SamplerOptions

def set_qubits(n: int):
    qr = QuantumRegister(n)  # Create a quantum register of size n
    cr = qiskit.ClassicalRegister(n)
    circuit = QuantumCircuit(qr, cr)
    circuit.h(qr)  # Apply Hadamard gate to all qubits
    circuit.measure(qr, cr)
    return circuit

# Replace your token with the actual API token
token = "e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5"
service = QiskitRuntimeService(channel="ibm_quantum", token=token)
backend = service.backend('ibm_osaka')

# Set up quantum circuit
circuit = set_qubits(1)  # Adjust register size as needed

# Transpile circuit for the backend
transpiled_circuit = transpile(circuit, backend)

# Print the transpiled circuit to check its structure
print("Transpiled Circuit:")
print(transpiled_circuit.draw())

# Initialize SamplerOptions, specifying any necessary options
options = SamplerOptions(default_shots=1024)  # Example: setting default shots

# Use the V2 Sampler with the specified options
try:
    sampler = SamplerV2(backend=backend, options=options)
    job = sampler.run(transpiled_circuit, shots=1024)
    result = job.result()
    print("Quantum job result:")
    print(result)
except Exception as e:
    print("An error occurred during job execution:", str(e))
