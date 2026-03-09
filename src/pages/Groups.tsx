function Groups() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
        Groups
      </h1>

      <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
        </svg>
        <p className="text-sm">No groups available</p>
        <p className="text-xs mt-1">Start the service to see proxy groups</p>
      </div>
    </div>
  );
}

export default Groups;
