// src/components/dashboard/components/MembersTable.tsx
interface Member {
  id: string;
  name: string;
  avatar: string;
  status: string;
  balance: string;
  joinedDate: string;
}

interface MembersTableProps {
  members: Member[];
}

export default function MembersTable({ members }: MembersTableProps) {
  const handleView = (memberId: string) => {
    console.log('View member:', memberId);
  };

  const handleEdit = (memberId: string) => {
    console.log('Edit member:', memberId);
  };

  const handleBlock = (memberId: string) => {
    console.log('Block member:', memberId);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1a558b]/5">
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
              Member ID
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
              Name
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
              Status
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
              Rewards Balance
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
              Joined Date
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 text-center">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {members.map((member) => (
            <tr key={member.id} className="hover:bg-[#1a558b]/5 transition-colors group">
              <td className="px-6 py-4">
                <span className="text-xs font-mono font-bold text-[#1a558b] px-2 py-1 bg-[#1a558b]/10 rounded">
                  {member.id}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img 
                      className="size-full object-cover" 
                      alt={`Member ${member.name} profile photo`}
                      src={member.avatar}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{member.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase bg-[#1a558b]/20 text-[#1a558b] border border-[#1a558b]/30" style={{ borderRadius: "9px" }}>
                  <span className="size-1.5 bg-[#1a558b]" style={{ borderRadius: "50%" }}></span>
                  {member.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-bold text-gray-900">{member.balance}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">{member.joinedDate}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button 
                    onClick={() => handleView(member.id)}
                    className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10" 
                    title="View Details"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(member.id)}
                    className="p-2 text-gray-600 hover:text-[#1a558b] transition-colors rounded-lg bg-gray-100 hover:bg-[#1a558b]/10" 
                    title="Edit Member"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button 
                    onClick={() => handleBlock(member.id)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors rounded-lg bg-gray-100 hover:bg-red-50" 
                    title="Block Member"
                  >
                    <span className="material-symbols-outlined text-sm">block</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="bg-[#1a558b]/5">
            <td className="px-6 py-3 text-center" colSpan={6}>
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                Showing {members.length} of {members.length} total records
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

