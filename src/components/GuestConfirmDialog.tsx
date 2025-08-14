
interface GuestConfirmDialogProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  adaptiveSize: {
    dialogEmojiSize: number;
    dialogTitleFontSize: number;
    dialogDescFontSize: number;
  };
}

export function GuestConfirmDialog({ 
  show, 
  onConfirm, 
  onCancel,
  adaptiveSize 
}: GuestConfirmDialogProps) {
  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="actions-panel mx-4 max-w-sm w-full flex flex-col gap-4 p-6"
      >
        <div className="text-center">
          <div className="mb-4" style={{ fontSize: `${adaptiveSize.dialogEmojiSize}px` }}>🚪</div>
          <h3 className="title-text mb-2" style={{ fontSize: `${adaptiveSize.dialogTitleFontSize}px` }}>
            게스트로 시작하시겠어요?
          </h3>
          <p className="description-text" style={{ fontSize: `${adaptiveSize.dialogDescFontSize}px`, lineHeight: '1.5' }}>
            게스트 모드에서는 일부 기능이 제한될 수 있어요. 
            언제든지 회원가입하시면 모든 기능을 이용할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-3">
          {/* [변경] 취소 버튼에 primary-button과 동일한 호버 효과를 추가했습니다. */}
          <button
            onClick={onCancel}
            className="secondary-button flex-1"
            style={{ transition: 'all 0.2s ease-in-out' }} // 부드러운 효과를 위한 transition 추가
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            취소
          </button>
          
          <button
            onClick={onConfirm}
            className="primary-button mb-0 flex-1"
          >
            게스트로 시작
          </button>
        </div>
      </div>
    </div>
  );
}
