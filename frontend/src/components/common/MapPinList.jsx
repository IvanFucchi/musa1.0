const MapPinList = ({pinsData}) => {
  if (!Array.isArray(pinsData)) return null;

  return (
    <div>
      {pinsData.map((pin, i) => (
        <div key={i}>
          <p>{pin.title}</p>
        </div>
      ))}
    </div>
  )
}
export default MapPinList;
