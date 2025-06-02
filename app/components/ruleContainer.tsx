'use client'
import IconButton from './iconButton';
import { MdOutlineQuestionMark } from 'react-icons/md';
import RuleModal from './ruleModal';
import { useState } from 'react';

export default function ClientLayout({className}: {className?: string}) {
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const handleOpenRuleModal = () => {
    setIsRuleModalOpen(true);
  };
  return (
    <>
      <div className={`fixed cursor-pointer ${className ?? ''}`}>
        <IconButton handleClickEvent={handleOpenRuleModal}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
      />
    </>
  );
}
