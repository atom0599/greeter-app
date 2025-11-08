import { ethers } from 'ethers'

// Greeter.sol의 ABI (Application Binary Interface)
// 이 부분은 Greeter.sol을 컴파일한 후 Remix에서 복사해도 되고,
// 이 코드를 그대로 사용해도 됩니다.
const contractABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'initialMessage',
        type: 'string',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'message',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'newMessage',
        type: 'string',
      },
    ],
    name: 'setMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// 1. 여기에 1단계에서 배포한 Greeter.sol의 "새 주소"를 넣으세요!
const contractAddress = '0x7234ffbd91b9Bb27d3317Ea4F520886D3b6795D1'

// 2. Sepolia RPC URL (Vercel 환경변수에도 등록 필요)
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'

/**
 * 브라우저 지갑 (MetaMask)과 상호작용하기 위한 Provider와 Signer를 반환
 */
function getBrowserProviderAndSigner() {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('지갑(MetaMask)이 설치되어 있지 않습니다.')
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = provider.getSigner() // Signer는 쓰기 작업을 위해 필요
  return { provider, signer }
}

/**
 * 누구나 메시지를 "읽을" 수 있는 읽기 전용 Provider와 Contract를 반환
 */
function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, contractABI, provider)
  return contract
}

/**
 * 사용자가 메시지를 "쓸" 수 있는 쓰기용 Signer와 Contract를 반환
 * @returns {Promise<ethers.Contract>}
 */
async function getWritableContract() {
  const { provider, signer } = getBrowserProviderAndSigner()
  // 네트워크가 Sepolia인지 확인 (Chain ID 11155111)
  const network = await provider.getNetwork()
  if (network.chainId !== 11155111n) { // 11155111n은 Sepolia Chain ID
    throw new Error('네트워크 오류: Sepolia 테스트넷으로 변경해주세요.')
  }
  
  const contract = new ethers.Contract(contractAddress, contractABI, await signer)
  return contract
}

/**
 * 지갑을 연결하고 계정 주소를 반환
 * @returns {Promise<string>}
 */
export async function connectWallet(): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('지갑(MetaMask)이 설치되어 있지 않습니다.')
  }
  
  const accounts = await window.ethereum.request<string[]>({
    method: 'eth_requestAccounts',
  })
  
  if (!accounts || accounts.length === 0) {
    throw new Error('지갑 연결에 실패했습니다.')
  }
  return accounts[0]
}

/**
 * 현재 컨트랙트에 저장된 메시지를 읽어옴
 * @returns {Promise<string>}
 */
export async function readMessage(): Promise<string> {
  const contract = getReadOnlyContract()
  try {
    const currentMessage = await contract.message()
    return currentMessage
  } catch (err) {
    console.error('메시지 읽기 실패:', err)
    return ''
  }
}

/**
 * 컨트랙트에 새로운 메시지를 저장 (트랜잭션 발생)
 * @param {string} newMessage
 * @returns {Promise<string>} 트랜잭션 해시
 */
export async function writeMessage(newMessage: string): Promise<string> {
  const contract = await getWritableContract()
  try {
    const tx = await contract.setMessage(newMessage)
    await tx.wait() // 트랜잭션이 채굴될 때까지 대기
    return tx.hash
  } catch (err) {
    console.error('메시지 쓰기 실패:', err)
    throw new Error('메시지 저장 트랜잭션에 실패했습니다.')
  }
}