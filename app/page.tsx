'use client'
import { useEffect, useState } from 'react'
import { connectWallet, readMessage, writeMessage } from '@/lib/eth' // TipJar 함수 대신 새 함수 임포트

export default function Home() {
  const [account, setAccount] = useState<string | undefined>(undefined)
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [newMessage, setNewMessage] = useState<string>('') // 새 메시지 입력값
  const [loading, setLoading] = useState<boolean>(false)
  const [txMessage, setTxMessage] = useState<string>('') // 트랜잭션 결과 메시지

  // 페이지 로드 시 현재 메시지를 읽어옴
  useEffect(() => {
    refreshMessage()
  }, [])

  // 에러 메시지 파싱 유틸 함수
  function getErrorMessage(err: unknown): string {
    if (typeof err === 'string') return err
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message?: unknown }).message
      if (typeof msg === 'string') return msg
    }
    return '알 수 없는 오류 발생'
  }

  // 컨트랙트에서 현재 메시지를 다시 읽어와 상태 업데이트
  async function refreshMessage() {
    setLoading(true)
    setTxMessage('메시지 로딩 중...')
    try {
      const msg = await readMessage()
      setCurrentMessage(msg)
      setTxMessage('메시지를 성공적으로 불러왔습니다.')
    } catch (e: unknown) {
      setTxMessage(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // 지갑 연결 버튼 클릭
  async function onConnect() {
    setLoading(true)
    setTxMessage('')
    try {
      const addr = await connectWallet()
      setAccount(addr)
      setTxMessage('지갑이 연결되었습니다.')
      await refreshMessage() // 연결 후 메시지 새로고침
    } catch (e: unknown) {
      setTxMessage(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  // 메시지 저장 (쓰기) 버튼 클릭
  async function onWriteMessage() {
    if (!newMessage) {
      setTxMessage('저장할 메시지를 입력하세요.')
      return
    }
    setLoading(true)
    setTxMessage('트랜잭션 승인 대기 중...')
    try {
      const hash = await writeMessage(newMessage)
      setTxMessage(`트랜잭션 성공! 해시: ${hash}`)
      
      // 성공 후 메시지를 즉시 새로고침
      await refreshMessage()
      setNewMessage('') // 입력창 비우기
    } catch (e: unknown) {
      setTxMessage(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-sans min-h-screen p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">간단한 메시지 저장 앱</h1>

      {/* 학번/이름 섹션 */}
      <section className="mb-6 p-4 border rounded-md bg-white">
        <p className="text-lg font-semibold text-black">정보보호학과</p>
        <p className="text-lg font-semibold text-black">92113798 이현</p>
      </section>

      {/* 지갑 연결 섹션 */}
      <section className="mb-6 p-4 border rounded-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">계정</div>
            <div className="font-mono break-all text-sm">
              {account ?? '연결되지 않음'}
            </div>
          </div>
          <button
            onClick={onConnect}
            disabled={loading}
            className="rounded-lg px-4 py-2 bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {account ? '지갑 새로고침' : '지갑 연결'}
          </button>
        </div>
      </section>

      {/* 현재 메시지 (읽기) 섹션 */}
      <section className="mb-6 p-4 border rounded-md">
        <div className="text-sm text-gray-500 mb-1">
          현재 블록체인에 저장된 메시지:
        </div>
        <div className="text-2xl font-semibold break-all">
          {currentMessage || '...'}
        </div>
      </section>

      {/* 새 메시지 (쓰기) 섹션 */}
      <section className="mb-6 p-4 border rounded-md">
        <div className="mb-3">
          <label className="block text-sm text-gray-500 mb-1">
            새 메시지 저장하기
          </label>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-black"
            placeholder="새 메시지를 입력하세요..."
            disabled={loading}
          />
        </div>
        <button
          onClick={onWriteMessage}
          disabled={loading || !account}
          className="rounded-md px-4 py-2 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 w-full"
        >
          {loading ? '저장 중...' : 'Sepolia에 메시지 저장하기'}
        </button>
      </section>

      {/* 결과 메시지 창 */}
      {txMessage && (
        <div className="mt-4 p-3 border rounded-md bg-gray-50 text-sm text-gray-700 break-all">
          {txMessage}
        </div>
      )}
    </div>
  )
}