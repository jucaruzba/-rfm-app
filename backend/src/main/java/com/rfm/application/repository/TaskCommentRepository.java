package com.rfm.application.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.rfm.application.model.entity.ActivityComment;
import com.rfm.application.model.entity.TaskComment;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long>{
	
    List<TaskComment> findByIdTaskOrderByCreatedAtDesc(Long idTask);
    
    @Modifying
    @Query("DELETE FROM TaskComment c WHERE c.idTask = :idTask")
    void deleteAllByIdActivity(Long idTask);

}
