from qiskit import QuantumCircuit, Aer, transpile
from qiskit.test.mock import FakeOsaka   # This is a simulator that mimics the 'ibm_osaka' backend

circuit = QuantumCircuit(1)
circuit.h(0)
circuit.measure_all()

backend = Aer.get_backend('qasm_simulator')  # Use a local simulator for initial tests
transpiled_circuit = transpile(circuit, backend=FakeOsaka())

print(transpiled_circuit.draw())
