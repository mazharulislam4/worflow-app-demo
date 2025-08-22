
interface PropsType {
  data: {
    icon: string;
    title: string;
    desc: string;
    time: string;
    popularity: string;
  };
  onClick?: () => void;
}

const ServiceCard = ({ data, onClick }: PropsType) => {
  return (
    <div
      key={data.title}
      className="bg-white p-6 rounded-md border hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{data.icon}</div>
        <h2 className="font-semibold text-lg">{data.title}</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">{data.desc}</p>
      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <span>⏱ {data.time}</span>
        <span>{data.popularity}</span>
      </div>
      <div className="text-blue-600 hover:underline text-sm font-medium">
        Request Service →
      </div>
    </div>
  );
};

export default ServiceCard;
