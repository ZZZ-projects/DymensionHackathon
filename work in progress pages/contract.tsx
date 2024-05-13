import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import ReactSyntaxHighlighter from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { generateSolidityCode } from './Services/SolidityGeneratorService';

const useWeb3 = () => {
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            setProvider(provider);
            setSigner(signer);
            setError("");
        } else {
            setError("Please install MetaMask.");
        }
    }, []);

    return { provider, signer, error };
};

type ABI = any; // You should define a more accurate type or use any from ethers if available
type Bytecode = string;

const useContract = (signer: ethers.providers.JsonRpcSigner | null, abi: ABI, bytecode: Bytecode) => {
    const [contract, setContract] = useState<ethers.ContractFactory | null>(null);

    useEffect(() => {
        if (signer && abi && bytecode) {
            const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
            setContract(contractFactory);
        }
    }, [signer, abi, bytecode]);

    return contract;
};

export const CodeEditorPage = () => {
    const { signer, error } = useWeb3();
    const [abi, setAbi] = useState<ABI>([]);
    const [bytecode, setBytecode] = useState<Bytecode>("");
    const contract = useContract(signer, abi, bytecode);

    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFetch = async () => {
        setLoading(true);
        try {
            const { code, abi, bytecode } = await generateSolidityCode(name, input);
            setCode(code);
            setAbi(abi);
            setBytecode(bytecode);
        } catch (e) {
            console.error(e); // Implement error handling
        }
        setLoading(false);
    };

    const handleCompileAndDeploy = async () => {
        if (!contract) return;
        setLoading(true);
        try {
            const deployedContract = await contract.deploy();
            console.log(`Contract deployed at ${deployedContract.address}`);
        } catch (e) {
            console.error(e); // Implement error handling
        }
        setLoading(false);
    };

    if (error) return <p>{error}</p>;

    return (
        <div>
            <textarea value={name} onChange={e => setName(e.target.value)} placeholder="Contract Name" />
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Contract Requirements" />
            <button onClick={handleFetch} disabled={loading}>Generate Code</button>
            <ReactSyntaxHighlighter language="solidity" style={darcula}>
                {code}
            </ReactSyntaxHighlighter>
            <button onClick={handleCompileAndDeploy} disabled={loading || !contract}>Compile & Deploy</button>
            {loading && <p>Loading...</p>}
        </div>
    );
};
