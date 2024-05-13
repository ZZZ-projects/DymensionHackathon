import qiskit
from qiskit import QuantumRegister, QuantumCircuit, transpile
from qiskit.circuit.library import RZGate
from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2, SamplerOptions
import math

def set_qubits(n: int):
    qr = QuantumRegister(n)
    cr = qiskit.ClassicalRegister(n)
    circuit = QuantumCircuit(qr, cr)
    # Apply RZ gate with a rotation of pi radians
    circuit.rz(math.pi, qr)  # RZ rotation applied to all qubits in the register
    circuit.h(qr)  # Apply Hadamard gate to qubits
    circuit.measure(qr, cr)
    return circuit

# Token and service initialization
token = "e3bed6f41718e889ae0c2df01f66d653f8d89b746cdaff50af04f8dd290e52ca642e8e96011131c8e21dee85bfb75a42fb3b944e9d075a3e213665d2c5929ab5"
service = QiskitRuntimeService(channel="ibm_quantum", token=token)
backend = service.backend('ibm_sherbrooke')

# Create and set up the circuit
circuit = set_qubits(3)  # 3 qubits for 8 possible outcomes

# Transpile circuit for the backend, specifying optimization and layout
transpiled_circuit = transpile(circuit, backend, optimization_level=2)

# Print the transpiled circuit to check its structure
print("Transpiled Circuit:")
print(transpiled_circuit.draw(output='text'))  # Ensures compatibility in all environments

# Sampler initialization with options
options = SamplerOptions(default_shots=1024)  # Example: setting default shots
sampler = SamplerV2(backend=backend, options=options)

# Function to convert binary to decimal and adjust for numbers from 1 to 8
def get_random_numbers(result):
    counts = result.get_counts()
    numbers = []
    for key in counts.keys():
        number = int(key, 2) + 1  # Convert from binary and adjust range starting at 1
        numbers.append(number)
    return numbers[:5]  # Get only the first 5 numbers

# Execute and get results
try:
    job = sampler.run(transpiled_circuit, shots=5)  # Execute the circuit with exactly 5 shots
    result = job.result()
    random_numbers = get_random_numbers(result)
    print("Random numbers:", random_numbers)
except Exception as e:
    print("An error occurred during job execution:", str(e))
