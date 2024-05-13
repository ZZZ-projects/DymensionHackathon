import qiskit
from qiskit import QuantumRegister, QuantumCircuit
from qiskit import Aer
from qiskit import execute
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

# Create and set up the circuit
circuit = set_qubits(3)  # 3 qubits for 8 possible outcomes

# Use Aer's qasm_simulator
simulator = Aer.get_backend('qasm_simulator')

# Execute the circuit on the qasm simulator
job = execute(circuit, simulator, shots=1024)

# Grab results from the job
result = job.result()

# Counts are the measurement results
counts = result.get_counts(circuit)
print("Counts:", counts)

# Function to convert binary to decimal and adjust for numbers from 1 to 8
def get_random_numbers(counts):
    numbers = []
    for key in counts.keys():
        number = int(key, 2) + 1  # Convert from binary and adjust range starting at 1
        for _ in range(counts[key]):  # Repeat for as many times as counted
            numbers.append(number)
    return numbers[:5]  # Get only the first 5 numbers

# Get random numbers
random_numbers = get_random_numbers(counts)
print("Random numbers:", random_numbers)
